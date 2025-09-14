import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { Item } from "./item.entity";
import { BaseEntity } from "src/common/database/base.entity";

@Entity("category")
export class Category extends BaseEntity {
  @Column({ unique: true })
  name: string;

  @OneToMany(() => Item, (item) => item.category_id)
  items: Item[];
}
