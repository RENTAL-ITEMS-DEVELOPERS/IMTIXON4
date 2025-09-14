import { ConflictException, Injectable } from "@nestjs/common";
import { CreateCategoryDto } from "./dto/create-category.dto";
import { UpdateCategoryDto } from "./dto/update-category.dto";
import { BaseService } from "src/infrastructure/base/base.service";
import { Category } from "src/core/entity/category.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import type { CategoryRepository } from "src/core/repository/category.repository";

@Injectable()
export class CategoryService extends BaseService<
  CreateCategoryDto,
  UpdateCategoryDto,
  Category
> {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepo: CategoryRepository,
  ) {
    super(categoryRepo);
  }

  async createCategory(createCategoryDto: CreateCategoryDto) {
    const existsName = await this.categoryRepo.findOne({
      where: { name: createCategoryDto.name },
    });
    if (existsName) {
      throw new ConflictException("Name already exists");
    }
    return super.create(createCategoryDto);
  }

  async updateCategory(id: string, updateCategoryDto: UpdateCategoryDto) {
    if (updateCategoryDto.name) {
      const existsName = await this.categoryRepo.findOne({
        where: { name: updateCategoryDto.name },
      });
      if (existsName && existsName.id != id) {
        throw new ConflictException("Name already exists");
      }
    }
    return super.update(id, updateCategoryDto);
  }
}
