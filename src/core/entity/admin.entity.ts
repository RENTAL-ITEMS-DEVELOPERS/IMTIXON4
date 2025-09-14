import { BaseEntity } from "src/common/database/base.entity";
import { Roles } from "src/common/enum";
import { Column, Entity } from "typeorm";

@Entity("admin")
export class AdminEntity extends BaseEntity {
  @Column({ type: "varchar", unique: true })
  username: string;

  @Column({ type: "varchar", unique: true })
  email: string;

  @Column({ type: "varchar" })
  hashed_password: string;

  @Column({ type: "boolean", default: true })
  is_active: boolean;

  @Column({ type: "boolean", default: false })
  is_deleted: boolean;

  @Column({ type: "enum", enum: Roles, default: Roles.ADMIN })
  role: Roles;

  @Column({ type: "boolean", default: false })
  isConfirmed: boolean;

  @Column({ type: "varchar", length: 6, nullable: true })
  otp: string | null;

  @Column({ type: "timestamp", nullable: true })
  otpExpiresAt: Date | null;
}
