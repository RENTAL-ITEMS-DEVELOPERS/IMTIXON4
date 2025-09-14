import { ConflictException, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { CreateItemDto } from "./dto/create-item.dto";
import { UpdateItemDto } from "./dto/update-item.dto";
import { BaseService } from "src/infrastructure/base/base.service";
import { Item } from "src/core/entity/item.entity";
import { Category } from "src/core/entity/category.entity";
import { Lessor } from "src/core/entity/lessor.entity";
import type { ItemRepository } from "src/core/repository/Item.repository";
import type { CategoryRepository } from "src/core/repository/category.repository";
import type { LessorRepository } from "src/core/repository/lessor.repository";

@Injectable()
export class ItemService extends BaseService<
  CreateItemDto,
  UpdateItemDto,
  Item
> {
  constructor(
    @InjectRepository(Item) private readonly itemRepo: ItemRepository,
    @InjectRepository(Category)
    private readonly categoryRepo: CategoryRepository,
    @InjectRepository(Lessor) private readonly lessorRepo: LessorRepository,
  ) {
    super(itemRepo);
  }

  async createItem(createItemDto: CreateItemDto) {
    const {
      category_id: categoryId,
      lessor_id: lessorId,
      ...rest
    } = createItemDto;

    const category = await this.categoryRepo.findOne({
      where: { id: categoryId },
    });
    if (!category) throw new ConflictException("Category not found");

    const lessor = await this.lessorRepo.findOne({ where: { id: lessorId } });
    if (!lessor) throw new ConflictException("Lessor not found");

    const newItem = this.itemRepo.create({
      ...rest,
      category_id: category,
      lessor_id: lessor,
    });
    return this.itemRepo.save(newItem);
  }

  async updateItem(id: string, updateItemDto: UpdateItemDto) {
    const item = await this.itemRepo.findOne({ where: { id } });
    if (!item) throw new ConflictException("Item not found");

    const {
      category_id: categoryId,
      lessor_id: lessorId,
      is_active: isActive,
      ...rest
    } = updateItemDto;

    if (categoryId) {
      const category = await this.categoryRepo.findOne({
        where: { id: categoryId },
      });
      if (!category) throw new ConflictException("Category not found");
      item.category_id = category;
    }
    if (lessorId) {
      const lessor = await this.lessorRepo.findOne({ where: { id: lessorId } });
      if (!lessor) throw new ConflictException("Lessor not found");
      item.lessor_id = lessor;
    }
    if (isActive != null) {
      item.is_active = isActive;
    }
    Object.assign(item, rest);

    return this.itemRepo.save(item);
  }
}
