import { Module } from "@nestjs/common";
import { ItemService } from "./item.service";
import { ItemController } from "./item.controller";
import { Item } from "src/core/entity/item.entity";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Lessor } from "src/core/entity/lessor.entity";
import { Category } from "src/core/entity/category.entity";

@Module({
  imports: [TypeOrmModule.forFeature([Item, Lessor, Category])],
  controllers: [ItemController],
  providers: [ItemService],
  exports: [ItemService],
})
export class ItemModule {}
