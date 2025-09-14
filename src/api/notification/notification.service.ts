import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Notification } from "src/core/entity/notification.entity";
import { Client } from "src/core/entity/client.entity";
import { CreateNotificationDto } from "./dto/create-notification.dto";
import { UpdateNotificationDto } from "./dto/update-notification.dto";

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,
    @InjectRepository(Client)
    private readonly clientRepo: Repository<Client>,
  ) {}

  async create(dto: CreateNotificationDto) {
    const client = await this.clientRepo.findOne({
      where: { id: dto.client_id },
    });
    if (!client) throw new NotFoundException("Client not found");

    const notification = this.notificationRepo.create({
      client_id: client,
      message: dto.message,
    });
    return this.notificationRepo.save(notification);
  }

  async findAll() {
    return this.notificationRepo.find({ relations: ["client_id"] });
  }

  async findOne(id: string) {
    const notification = await this.notificationRepo.findOne({
      where: { id },
      relations: ["client_id"],
    });
    if (!notification) throw new NotFoundException("Notification not found");
    return notification;
  }

  async update(id: string, dto: UpdateNotificationDto) {
    const notification = await this.notificationRepo.findOne({ where: { id } });
    if (!notification) throw new NotFoundException("Notification not found");

    if (dto.client_id) {
      const client = await this.clientRepo.findOne({
        where: { id: dto.client_id },
      });
      if (!client) throw new NotFoundException("Client not found");
      notification.client_id = client;
    }

    if (dto.message) notification.message = dto.message;

    return this.notificationRepo.save(notification);
  }

  async remove(id: string) {
    const notification = await this.notificationRepo.findOne({ where: { id } });
    if (!notification) throw new NotFoundException("Notification not found");

    return this.notificationRepo.remove(notification);
  }
}
