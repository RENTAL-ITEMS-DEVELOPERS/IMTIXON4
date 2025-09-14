import { ApiProperty, PartialType } from "@nestjs/swagger";
import { CreateClientDto } from "./create-client.dto";
import { IsBoolean, IsNumber, IsOptional } from "class-validator";

export class UpdateClientDto extends PartialType(CreateClientDto) {
  @ApiProperty()
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
