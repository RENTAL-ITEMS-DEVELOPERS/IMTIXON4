import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as path from 'path';
import { Images } from 'src/core/entity/image.entity';
import { Item } from 'src/core/entity/item.entity';
import { Repository } from 'typeorm';
import * as fs from 'fs';
import type { ImagesRepository } from 'src/core/repository/images.repository';
import type { ItemRepository } from 'src/core/repository/Item.repository';

@Injectable()
export class ImagesService {
  constructor(
    @InjectRepository(Images)
    private readonly imagesRepository: ImagesRepository,
    @InjectRepository(Item)
    private readonly itemRepository: ItemRepository,
  ) {}

  async uploadImages(files: Express.Multer.File[], itemId: string) {
    const item = await this.itemRepository.findOne({ where: { id: itemId } });
    if (!item) {
      throw new BadRequestException('Item not found');
    }

    const images = files.map((file) =>
      this.imagesRepository.create({
        image_url: file.filename,
        item_id: item,
      }),
    );

    return this.imagesRepository.save(images);
  }

  async getImagesByItem(itemId: string) {
    return this.imagesRepository.find({
      where: { item_id: { id: itemId } },
      relations: ['item_id'],
    });
  }

  async deleteImage(id: string) {
    const image = await this.imagesRepository.findOne({ where: { id } });
    if (!image) throw new NotFoundException('Image not found');

    const filePath = path.join(
      process.cwd(),
      'uploads/images',
      image.image_url,
    );
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    return this.imagesRepository.remove(image);
  }

  async updateImage(id: string, file: Express.Multer.File) {
    const image = await this.imagesRepository.findOne({
      where: { id },
      relations: ['item_id'],
    });
    if (!image) throw new NotFoundException('Image not found');

    const oldPath = path.join(process.cwd(), 'uploads/images', image.image_url);
    if (fs.existsSync(oldPath)) {
      fs.unlinkSync(oldPath);
    }

    image.image_url = file.filename;
    return this.imagesRepository.save(image);
  }
}
