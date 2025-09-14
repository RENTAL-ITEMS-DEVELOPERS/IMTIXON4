import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { PaymentPaginationDto } from 'src/common/dto/payment-query.dto';
import { PaymentStatus } from 'src/core/entity/payment.entity';
import { ILike } from 'typeorm';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { PaymentService } from './payment.service';

@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post()
  create(@Body() createPaymentDto: CreatePaymentDto) {
    return this.paymentService.create(createPaymentDto);
  }

  @Get('paginated')
  async findAllWithPagination(@Query() queryDto: PaymentPaginationDto) {
    const { page = 0, limit = 10, user_name, status } = queryDto;
    const where = user_name
      ? { client_id: { user_name: ILike(`%${user_name}%`) } }
      : status
        ? { status }
        : { status: PaymentStatus.PAID };

    return this.paymentService.findAllWithPagination({
      where,
      order: { createdAt: 'DESC' },
      relations: ['client_id', 'order_id'],
      skip: page,
      take: limit,
    });
  }

  @Get()
  findAll() {
    return this.paymentService.findAll({
      relations: ['client_id', 'order_id'],
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.paymentService.findOneBy({
      where: { id },
      relations: ['client_id', 'order_id'],
    });
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePaymentDto: UpdatePaymentDto) {
    return this.paymentService.update(id, updatePaymentDto);
  }

  @Get('order/:orderId')
  getByOrder(@Param('orderId') orderId: string) {
    return this.paymentService.getPaymentsByOrderId(orderId);
  }

  @Get('client/:clientId')
  getByClient(@Param('clientId') clientId: string) {
    return this.paymentService.getPaymentsByClientId(clientId);
  }

  @Post(':id/refund')
  refund(@Param('id') id: string) {
    return this.paymentService.refundPayment(id);
  }

  @Post(':id/verify')
  verify(@Param('id') id: string) {
    return this.paymentService.verifyPayment(id);
  }

  @Get('total/client/:clientId')
  calculateTotalByClient(@Param('clientId') clientId: string) {
    return this.paymentService.calculateTotalPaymentsByClient(clientId);
  }
}
