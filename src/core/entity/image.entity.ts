import { Entity, Column, ManyToOne } from "typeorm";
import { Item } from "./item.entity";
import { BaseEntity } from "src/common/database/base.entity";

@Entity("images")
export class Images extends BaseEntity {
  @Column()
  image_url: string;

  @ManyToOne(() => Item, (item) => item.images, {
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  })
  item_id: Item;
}
