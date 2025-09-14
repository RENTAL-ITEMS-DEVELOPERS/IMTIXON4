import { Column, Entity, ManyToOne, OneToOne } from "typeorm";

import { BaseEntity } from "src/common/database/base.entity";
import { Client } from "./client.entity";
import { Order } from "./order.entity";

export enum PaymentStatus {
  PENDING = "pending",
  PAID = "paid",
  FAILED = "failed",
  REFUNDED = "refunded",
}

export enum PaymentMethod {
  CARD = "card",
}

@Entity({ name: "payments" })
export class Payment extends BaseEntity {
  @OneToOne(() => Order, (order) => order.payment_id, {
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  })
  order_id: Order;

  @ManyToOne(() => Client, (client) => client.payments, {
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  })
  client_id: Client;

  @Column("decimal", { precision: 10, scale: 2 })
  amount_sum: number;

  @Column({
    type: "enum",
    enum: PaymentMethod,
    default: PaymentMethod.CARD, // O'
  })
  payment_method: PaymentMethod;

  @Column({
    type: "enum",
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  status: PaymentStatus;
}
