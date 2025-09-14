import { BaseEntity } from "src/common/database/base.entity";
import { Column, Entity } from "typeorm";

@Entity("wallet")
export class Wallet extends BaseEntity {
  @Column("decimal")
  wallet: number;
}
