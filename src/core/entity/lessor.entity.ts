import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { Item } from "./item.entity";
import { Roles } from "src/common/enum";
import { BaseEntity } from "src/common/database/base.entity";

@Entity("lessor")
export class Lessor extends BaseEntity {
  @Column({ unique: true })
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

  @Column({ type: "enum", enum: Roles, default: Roles.LESSOR })
  role: Roles;

  @Column({ type: "boolean", default: false })
  isConfirmed: boolean;

  @Column({ type: "varchar", length: 6, nullable: true })
  otp: string | null;

  @Column({ type: "timestamp", nullable: true })
  otpExpiresAt: Date | null;

  @OneToMany(() => Item, (item) => item.lessor_id)
  items: Item[];
}
