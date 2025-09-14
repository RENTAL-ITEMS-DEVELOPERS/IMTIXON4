import { ApiProperty, PartialType } from "@nestjs/swagger";
import { CreateLessorDto } from "./create-lessor.dto";
import { IsBoolean, IsNumber, IsOptional } from "class-validator";

export class UpdateLessorDto extends PartialType(CreateLessorDto) {
  @ApiProperty()
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
