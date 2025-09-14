import { PartialType } from '@nestjs/swagger';
import { CreateImagesDto } from './create-image.dto';

export class UpdateImageDto extends PartialType(CreateImagesDto) {}
