import { BaseEntity } from "src/common/database/base.entity";
import { Column, Entity, ManyToOne, JoinColumn } from "typeorm";
import { Client } from "src/core/entity/client.entity";

@Entity("notification")
export class Notification extends BaseEntity {
  @ManyToOne(() => Client, (client) => client.notifications, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "client_id" })
  client_id: Client;

  @Column({ type: "text" })
  message: string;
}
