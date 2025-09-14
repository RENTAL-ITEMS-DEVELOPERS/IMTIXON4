import {
  Controller,
  Get,
  Post,
  Param,
  Delete,
  UseInterceptors,
  UploadedFiles,
  UploadedFile,
  BadRequestException,
  Put,
} from '@nestjs/common';
import { ImagesService } from './images.service';
import { extname } from 'path';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import type { Express } from 'express';
import { diskStorage } from 'multer';
import { ApiBody, ApiConsumes } from '@nestjs/swagger';

@Controller('images')
export class ImagesController {
  constructor(private readonly imagesService: ImagesService) {}

  @Post('upload/:itemId')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
      },
    },
  })
  @UseInterceptors(
    FilesInterceptor('files', 5, {
      storage: diskStorage({
        destination: './uploads/images',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random());
          cb(null, uniqueSuffix + extname(file.originalname));
        },
      }),
      limits: {
        fileSize: 30 * 1024 * 1024,
      },
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png)$/)) {
          return cb(
            new BadRequestException('Only image files allowed!'),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  async uploadFiles(
    @UploadedFiles() files: Express.Multer.File[],
    @Param('itemId') itemId: string,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }
    return this.imagesService.uploadImages(files, itemId);
  }

  @Get('item/:itemId')
  async getImages(@Param('itemId') itemId: string) {
    return this.imagesService.getImagesByItem(itemId);
  }

  @Delete(':id')
  async deleteFile(@Param('id') id: string) {
    return this.imagesService.deleteImage(id);
  }

  @Put('update/:id')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/images',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random());
          cb(null, uniqueSuffix + extname(file.originalname));
        },
      }),
      limits: { fileSize: 30 * 1024 * 1024 },
    }),
  )
  async updateFile(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('No file uploaded');
    return this.imagesService.updateImage(id, file);
  }
}
