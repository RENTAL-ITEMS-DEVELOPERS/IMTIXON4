import { Module } from '@nestjs/common';
import { ImagesService } from './images.service';
import { ImagesController } from './images.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Images } from 'src/core/entity/image.entity';
import { Item } from 'src/core/entity/item.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Images, Item])],
  controllers: [ImagesController],
  providers: [ImagesService],
})
export class ImagesModule {}
