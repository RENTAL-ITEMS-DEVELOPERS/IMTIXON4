import { ApiProperty, PartialType } from "@nestjs/swagger";
import { CreateItemDto } from "./create-item.dto";
import { IsBoolean, IsOptional } from "class-validator";

export class UpdateItemDto extends PartialType(CreateItemDto) {
  @ApiProperty()
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
