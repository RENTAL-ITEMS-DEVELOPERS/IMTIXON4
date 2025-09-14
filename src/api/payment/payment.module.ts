import { Module } from "@nestjs/common";
import { PaymentService } from "./payment.service";
import { PaymentController } from "./payment.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Payment } from "src/core/entity/payment.entity";
import { Order } from "src/core/entity/order.entity";
import { Client } from "src/core/entity/client.entity";
import { Wallet } from "src/core/entity/group-wallet.entity";

@Module({
  imports: [TypeOrmModule.forFeature([Payment, Order, Client, Wallet])],
  controllers: [PaymentController],
  providers: [PaymentService],
})
export class PaymentModule {}
