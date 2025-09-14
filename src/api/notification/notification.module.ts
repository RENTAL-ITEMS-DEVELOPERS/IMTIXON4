import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Notification } from "src/core/entity/notification.entity";
import { Order } from "src/core/entity/order.entity";
import { Client } from "src/core/entity/client.entity";
import { NotificationService } from "./notification.service";
import { NotificationController } from "./notification.controller";
import { NotificationGateway } from "./notification.gateway";
import { NotificationCron } from "./notification.cron";

@Module({
  imports: [TypeOrmModule.forFeature([Notification, Order, Client])],
  controllers: [NotificationController],
  providers: [NotificationService, NotificationGateway, NotificationCron],
})
export class NotificationModule {}
