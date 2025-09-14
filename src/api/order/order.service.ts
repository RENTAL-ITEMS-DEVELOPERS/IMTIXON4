import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { OrderStatus } from 'src/common/enum/index';
import { Client } from 'src/core/entity/client.entity';
import { Wallet } from 'src/core/entity/group-wallet.entity';
import { Item } from 'src/core/entity/item.entity';
import { Lessor } from 'src/core/entity/lessor.entity';
import { Order } from 'src/core/entity/order.entity';

import type { ClientRepository } from 'src/core/repository/client.repository';
import type { walletRepository } from 'src/core/repository/gorup-wallet.repository';
import type { ItemRepository } from 'src/core/repository/Item.repository';
import type { LessorRepository } from 'src/core/repository/lessor.repository';
import type { OrderRepository } from 'src/core/repository/order.reopsitory';

import { config } from 'src/config';
import { BaseService } from 'src/infrastructure/base/base.service';
import { successRes } from 'src/infrastructure/response/success';
import { ISuccess } from 'src/infrastructure/response/success.interface';
import { DataSource } from 'typeorm';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';

@Injectable()
export class OrderService extends BaseService<
  CreateOrderDto,
  UpdateOrderDto,
  Order
> {
  constructor(
    @InjectRepository(Order) private readonly orderRepo: OrderRepository,
    @InjectRepository(Item) private readonly itemRepo: ItemRepository,
    @InjectRepository(Client) private readonly clientRepo: ClientRepository,
    @InjectRepository(Wallet) private readonly walletRepo: walletRepository,
    @InjectRepository(Lessor) private readonly lessorRepo: LessorRepository,
    private readonly dataSource: DataSource,
  ) {
    super(orderRepo);
  }

  async create(createOrderDto: CreateOrderDto): Promise<ISuccess> {
    const {
      client_id,
      item_id,
      quantity,
      address,
      start_date,
      end_date,
      notes,
    } = createOrderDto;

    const client = await this.clientRepo.findOne({ where: { id: client_id } });
    if (!client) throw new NotFoundException('Client not found');

    const item = await this.itemRepo.findOne({ where: { id: item_id } });
    if (!item) throw new NotFoundException('Item not found');

    if (item.quantity - item.rented_quantity < quantity) {
      throw new ConflictException(
        `Not enough quantity available. Remaining: ${
          item.quantity - item.rented_quantity
        }, asked: ${quantity}`,
      );
    }

    const endDate = new Date(end_date);
    const startDate = new Date(start_date);

    const dayInterval =
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);

    const amount = quantity * item.price * dayInterval;

    const newOrder = this.orderRepo.create({
      client_id: client,
      item_id: item,
      amount_sum: amount,
      quantity,
      address,
      start_date,
      end_date,
      notes: notes || '',
    });

    await this.orderRepo.save(newOrder);

    return successRes(newOrder);
  }

  async update(id: string, updateOrderDto: UpdateOrderDto): Promise<ISuccess> {
    const order = await this.orderRepo.findOne({
      where: { id },
      relations: ['client_id', 'item_id', 'payment_id'],
    });

    if (!order) throw new NotFoundException(`Order not found`);

    Object.assign(order, updateOrderDto);

    await this.orderRepo.save(order);

    return successRes(order);
  }

  async remove(id: string): Promise<ISuccess> {
    const order = await this.orderRepo.findOne({ where: { id } });
    if (!order) throw new NotFoundException(`Order not found`);

    await this.orderRepo.remove(order);
    return successRes({});
  }

  async cancelOrder(id: string): Promise<ISuccess> {
    const order = await this.orderRepo.findOne({
      where: { id },
      relations: ['client_id', 'item_id', 'item_id.lessor_id'],
    });
    if (!order) throw new NotFoundException('Order not found');

    if (order.status === OrderStatus.CANCELLED) {
      throw new ConflictException('Order already cancelled');
    }

    await this.dataSource.transaction(async (manager) => {
      await manager.update(
        Item,
        { id: order.item_id.id },
        { rented_quantity: +order.item_id.rented_quantity - +order.quantity },
      );

      await manager.update(
        Client,
        { id: order.client_id.id },
        { wallet: +order.client_id.wallet + +order.amount_sum },
      );

      await manager.update(
        Lessor,
        { id: order.item_id.lessor_id.id },
        { wallet: +order.item_id.lessor_id.wallet - +order.amount_sum * 0.9 },
      );

      const wallet = (await this.walletRepo.find())[0];
      await manager.update(
        Wallet,
        { id: wallet.id },
        { wallet: +wallet.wallet - +order.amount_sum * 0.1 },
      );

      order.status = OrderStatus.CANCELLED;
      order.is_active = false;
      await manager.save(order);
    });

    return successRes(order);
  }

  async extendOrderDate(id: string, extraDate: Date): Promise<ISuccess> {
    const order = await this.orderRepo.findOne({ where: { id } });
    if (!order) throw new NotFoundException('Order not found');
    
    if (order.status !== OrderStatus.CONFIRMED) {
      throw new ConflictException('Only active orders can be extended');
    }

    order.extraDays = extraDate;
    order.status = OrderStatus.PENDING;

    await this.orderRepo.save(order);
    return successRes(order);
  }

  async getActiveOrders(): Promise<ISuccess> {
    const orders = await this.orderRepo.find({
      where: { status: OrderStatus.CONFIRMED, is_active: true },
      relations: ['client_id', 'item_id'],
      order: { createdAt: 'DESC' },
    });

    return successRes({
      ...orders,
      endPoint: {
        url: `http://locahost:${config.API_PORT}/api/v1/payments`,
        method: 'POST',
      },
    });
  }

  async getTopItems(): Promise<ISuccess> {
    const result = await this.orderRepo
      .createQueryBuilder('order')
      .select('item_id', 'item')
      .addSelect('COUNT(order.id)', 'totalOrders')
      .groupBy('order.item_id')
      .orderBy('totalOrders', 'DESC')
      .limit(5)
      .getRawMany();

    return successRes(result);
  }

  async getMostProfitableItems(): Promise<ISuccess> {
    const result = await this.orderRepo
      .createQueryBuilder('order')
      .select('item_id', 'item')
      .addSelect('SUM(order.amount_sum)', 'totalProfit')
      .groupBy('order.item_id')
      .orderBy('totalProfit', 'DESC')
      .limit(5)
      .getRawMany();

    return successRes(result);
  }
}
