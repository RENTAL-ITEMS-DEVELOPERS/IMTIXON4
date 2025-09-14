import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Client } from "src/core/entity/client.entity";
import { Wallet } from "src/core/entity/group-wallet.entity";
import { Item } from "src/core/entity/item.entity";
import { Lessor } from "src/core/entity/lessor.entity";
import { Order } from "src/core/entity/order.entity";
import { AuthModule } from "../auth/auth.module";
import { OrderController } from "./order.controller";
import { OrderService } from "./order.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, Client, Item, Wallet, Lessor]),
    AuthModule,
  ],
  controllers: [OrderController],
  providers: [OrderService],
  exports: [OrderService],
})
export class OrderModule {}
