import { Entity, Column, ManyToOne, JoinColumn } from "typeorm";
import { Order } from "./order.entity";
import { Client } from "./client.entity";
import { BaseEntity } from "src/common/database/base.entity";

@Entity("penalties")
export class Penalty extends BaseEntity {
  @ManyToOne(() => Order, (o) => o.penalty, { onDelete: "CASCADE" })
  @JoinColumn({ name: "order_id" })
  order: Order;

  @ManyToOne(() => Client, (c) => c.penalties, { onDelete: "SET NULL" })
  @JoinColumn({ name: "client_id" })
  client: Client;

  @Column({ type: "numeric", precision: 12, scale: 2, default: 0 })
  amount: number;

  @Column({ type: "int", default: 0 })
  days: number;

  @Column({ type: "varchar", length: 255, nullable: true })
  reason: string;
}
