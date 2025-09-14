import { Column, Entity, OneToMany } from "typeorm";
import { Notification } from "./notification.entity";
import { Order } from "./order.entity";
import { Payment } from "./payment.entity";
import { Penalty } from "./penalty.entity";
import { Roles } from "src/common/enum";
import { BaseEntity } from "src/common/database/base.entity";

@Entity("client")
export class Client extends BaseEntity {
  @Column({ type: "varchar", unique: true })
  user_name: string;

  @Column({ unique: true })
  phone_number: string;

  @Column({ type: "varchar", unique: true })
  email: string;

  @Column({ type: "varchar" })
  hashed_password: string;

  @Column({ type: "boolean", default: true })
  is_active: boolean;

  @Column({ type: "int", default: 0 })
  wallet: number;

  @Column({ type: "enum", enum: Roles, default: Roles.CLIENT })
  role: Roles;

  @Column({ type: "boolean", default: false })
  isConfirmed: boolean;

  @Column({ type: "varchar", length: 6, nullable: true })
  otp: string | null;

  @Column({ type: "timestamp", nullable: true })
  otpExpiresAt: Date | null;

  @OneToMany(() => Payment, (payment) => payment.client_id)
  payments: Payment[];

  @OneToMany(() => Order, (order) => order.client_id)
  orders: Order[];

  @OneToMany(() => Notification, (notification) => notification.client_id)
  notifications: Notification[];

  @OneToMany(() => Penalty, (penalty) => penalty.client)
  penalties: Penalty[];
}
