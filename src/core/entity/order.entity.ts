import { BaseEntity } from "src/common/database/base.entity";
import { OrderStatus } from "src/common/enum/index";
import { Column, Entity, JoinColumn, ManyToOne, OneToOne } from "typeorm";
import { Client } from "./client.entity";
import { Item } from "./item.entity";
import { Payment } from "./payment.entity";
import { Penalty } from "./penalty.entity";

@Entity({ name: "orders" })
export class Order extends BaseEntity {
  @Column("decimal", { precision: 10, scale: 2 })
  amount_sum: number;

  @Column("int")
  quantity: number;

  @Column({ type: "varchar", length: 255 })
  address: string;

  @Column({
    type: "enum",
    enum: OrderStatus,
    default: OrderStatus.PENDING,
  })
  status: OrderStatus;

  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  start_date: Date;

  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  end_date: Date;

  @Column({ type: "timestamp", nullable: true })
  extraDays: Date | null;

  @Column({ type: "timestamp", nullable: true })
  returned_at?: Date;

  @Column({ default: true })
  is_active: boolean;

  @Column({ type: "varchar", nullable: true })
  notes?: string;

  @ManyToOne(() => Client, (client) => client.orders, {
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  })
  client_id: Client;

  @ManyToOne(() => Item, (item) => item.orders, {
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  })
  item_id: Item;

  @OneToOne(() => Payment, (payment) => payment.order_id, {
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  })
  @JoinColumn({ name: "payment_id" })
  payment_id: Payment;

  @OneToOne(() => Penalty, (penalty) => penalty.order)
  penalty: Penalty;
}
