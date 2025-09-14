import { Injectable } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { Repository, Raw } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { Order } from "src/core/entity/order.entity";
import { Notification } from "src/core/entity/notification.entity";
import { NotificationGateway } from "./notification.gateway";
import dayjs from "dayjs";

@Injectable()
export class NotificationCron {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,

    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,

    private readonly notificationGateway: NotificationGateway,
  ) {}

  @Cron("0 0 * * *")
  async handleCron() {
    const tomorrowStr = dayjs().add(1, "day").format("YYYY-MM-DD");

    const orders = await this.orderRepository.find({
      where: {
        end_date: Raw((alias) => `DATE(${alias}) = '${tomorrowStr}'`),
      },
      relations: ["client_id"],
    });

    for (const order of orders) {
      const message = `Sizning ijarangiz ${tomorrowStr} kuni tugaydi.`;

      const notification = this.notificationRepository.create({
        client_id: order.client_id,
        message,
      });
      await this.notificationRepository.save(notification);

      this.notificationGateway.sendNotification(order.client_id.id, message);
    }
  }
}
