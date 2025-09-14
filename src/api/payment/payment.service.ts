import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  OnModuleInit,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { OrderStatus } from "src/common/enum/index";
import { Client } from "src/core/entity/client.entity";
import { Wallet } from "src/core/entity/group-wallet.entity";
import { Item } from "src/core/entity/item.entity";
import { Lessor } from "src/core/entity/lessor.entity";
import { Order } from "src/core/entity/order.entity";
import { Payment, PaymentStatus } from "src/core/entity/payment.entity";
import { BaseService } from "src/infrastructure/base/base.service";
import { successRes } from "src/infrastructure/response/success";
import { ISuccess } from "src/infrastructure/response/success.interface";
import { DataSource, Repository } from "typeorm";
import { CreatePaymentDto } from "./dto/create-payment.dto";
import { UpdatePaymentDto } from "./dto/update-payment.dto";

@Injectable()
export class PaymentService
  extends BaseService<CreatePaymentDto, UpdatePaymentDto, Payment>
  implements OnModuleInit
{
  constructor(
    @InjectRepository(Order) private readonly orderRepo: Repository<Order>,
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
    @InjectRepository(Client) private readonly clientRepo: Repository<Client>,
    @InjectRepository(Wallet) private readonly walletRepo: Repository<Wallet>,
    private readonly dataSource: DataSource,
  ) {
    super(paymentRepo);
  }

  async onModuleInit() {
    const wallets = await this.walletRepo.find();
    if (!wallets.length) {
      const wallet = this.walletRepo.create({ wallet: 0 });
      await this.walletRepo.save(wallet);
      console.log("Platform wallet initialized.");
    }
  }

  async create(createPaymentDto: CreatePaymentDto): Promise<ISuccess> {
    const { order_id, client_id } = createPaymentDto;

    const order = await this.orderRepo.findOne({
      where: { id: order_id },
      relations: ["item_id", "item_id.lessor_id", "client_id"],
    });
    if (!order) throw new NotFoundException("Order not found");
    if (order.status !== OrderStatus.PENDING)
      throw new BadRequestException("Payment already processed");

    const client = await this.clientRepo.findOne({ where: { id: client_id } });
    if (!client) throw new NotFoundException("Client not found");

    let amount = order.amount_sum;
    const profit = amount * 0.1;
    const lessor = order.item_id.lessor_id;

    if (+client.wallet < amount)
      // O'
      throw new BadRequestException("Insufficient wallet balance");

    let payment: any; // O'

    await this.dataSource.transaction(async (manager) => {
      await manager.update(
        Client,
        { id: client.id },
        { wallet: client.wallet - amount },
      );

      await manager.update(
        Item,
        { id: order.item_id.id },
        { rented_quantity: order.item_id.rented_quantity + order.quantity },
      );

      await manager.update(
        Lessor,
        { id: lessor.id },
        { wallet: lessor.wallet + (amount - profit) },
      );

      const platformWallet = await manager.findOne(Wallet, { where: {} });
      if (!platformWallet)
        throw new InternalServerErrorException("Platform wallet not found");
      await manager.update(
        Wallet,
        { id: platformWallet.id },
        { wallet: platformWallet.wallet + profit },
      );

      await manager.update(
        Order,
        { id: order.id },
        { status: OrderStatus.CONFIRMED },
      );

      payment = manager.create(Payment, {
        order_id: order,
        client_id: client,
        amount_sum: amount,
        status: PaymentStatus.PAID,
      });

      await manager.save(Payment, payment);
    });

    return successRes(payment!, 201);
  }

  async update(
    id: string,
    updatePaymentDto: UpdatePaymentDto,
  ): Promise<ISuccess> {
    const payment = await this.paymentRepo.findOne({ where: { id } });
    if (!payment) throw new NotFoundException("Payment not found");

    Object.assign(payment, updatePaymentDto);
    await this.paymentRepo.save(payment);
    return successRes(payment, 200);
  }

  async remove(id: string): Promise<ISuccess> {
    const payment = await this.paymentRepo.findOne({ where: { id } });
    if (!payment) throw new NotFoundException("Payment not found");

    await this.paymentRepo.remove(payment);
    return successRes({ id, message: "Payment removed successfully" }, 200);
  }

  async findOneById(id: string): Promise<ISuccess> {
    const payment = await this.paymentRepo.findOne({
      where: { id },
      relations: ["client_id", "order_id"],
    });
    if (!payment) throw new NotFoundException("Payment not found");
    return successRes(payment, 200);
  }

  async getPaymentsByOrderId(orderId: string): Promise<ISuccess> {
    const payments = await this.paymentRepo.find({
      where: { order_id: { id: orderId } },
      relations: ["client_id", "order_id"],
    });
    return successRes(payments, 200);
  }

  async getPaymentsByClientId(clientId: string): Promise<ISuccess> {
    const payments = await this.paymentRepo.find({
      where: { client_id: { id: clientId } },
      relations: ["client_id", "order_id"],
    });
    return successRes(payments, 200);
  }

  async refundPayment(id: string): Promise<ISuccess> {
    const payment = await this.paymentRepo.findOne({
      where: { id, order_id: { status: OrderStatus.CONFIRMED } }, // O'
      relations: [
        "client_id",
        "order_id",
        "order_id.item_id",
        "order_id.item_id.lessor_id",
      ],
    });
    if (!payment) throw new NotFoundException("Payment not found");
    if (payment.status !== PaymentStatus.PAID)
      throw new BadRequestException("Only paid payments can be refunded");

    const client = payment.client_id;
    const order = payment.order_id;
    const lessor = order.item_id.lessor_id;

    const platformWallet = await this.walletRepo.findOne({ where: {} });
    if (!platformWallet)
      throw new InternalServerErrorException("Platform wallet not found");

    await this.dataSource.transaction(async (manager) => {
      await manager.update(
        Client,
        { id: client.id },
        { wallet: +client.wallet + +payment.amount_sum },
      );
      const profit = payment.amount_sum * 0.1;
      await manager.update(
        Lessor,
        { id: lessor.id },
        { wallet: lessor.wallet - (payment.amount_sum - profit) },
      );
      await manager.update(
        Wallet,
        { id: platformWallet.id },
        { wallet: platformWallet.wallet - profit },
      );

      payment.status = PaymentStatus.REFUNDED;
      await manager.save(Payment, payment);

      await manager.update(
        Order,
        { id: order.id },
        { status: OrderStatus.PENDING },
      );
    });

    return successRes(payment, 202);
  }

  async verifyPayment(id: string): Promise<ISuccess> {
    const payment = await this.paymentRepo.findOne({ where: { id } });
    if (!payment) throw new NotFoundException("Payment not found");

    payment.status = PaymentStatus.PAID;
    await this.paymentRepo.save(payment);
    return successRes(payment, 200);
  }

  async calculateTotalPaymentsByClient(clientId: string): Promise<ISuccess> {
    const payments = await this.paymentRepo.find({
      where: { client_id: { id: clientId }, status: PaymentStatus.PAID },
    });
    console.log(payments);
    const total = payments.reduce((sum, p) => +sum + +p.amount_sum, 0);
    return successRes({ clientId, total }, 200);
  }
}
