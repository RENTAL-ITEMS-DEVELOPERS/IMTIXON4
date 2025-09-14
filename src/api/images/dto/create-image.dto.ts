import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateImagesDto {
  @ApiProperty()
  @IsString()
  image_url: string;

  @ApiProperty()
  @IsString()
  item_id: string;
}
