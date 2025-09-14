import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from "typeorm";
import { Lessor } from "./lessor.entity";
import { Category } from "./category.entity";
import { Order } from "./order.entity";
import { Images } from "./image.entity";
import { BaseEntity } from "src/common/database/base.entity";

@Entity("item")
export class Item extends BaseEntity {
  @Column()
  name: string;

  @Column("decimal", { precision: 10, scale: 2 })
  price: number;

  @Column("int")
  quantity: number;

  @Column({ type: "int", default: 0 })
  rented_quantity: number;

  @Column({ nullable: true })
  description: string;

  @Column({ default: true })
  is_active: boolean;

  @ManyToOne(() => Category, (category) => category.items, {
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  })
  category_id: Category;

  @ManyToOne(() => Lessor, (lessor) => lessor.items, {
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  })
  // @JoinColumn({ name: 'lessor_id' })
  lessor_id: Lessor;

  @OneToMany(() => Order, (order) => order.item_id)
  orders: Order[];

  @OneToMany(() => Images, (image) => image.item_id)
  images: Images[];
}
