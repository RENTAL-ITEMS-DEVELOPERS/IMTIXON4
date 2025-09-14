import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsNumber, IsOptional, IsString } from "class-validator";
import { Type } from "class-transformer";
import { PaymentStatus } from "src/core/entity/payment.entity";

export class PaymentPaginationDto {
  @ApiPropertyOptional({
    type: "string",
    example: "Eshmat",
    description: "Query for search",
  })
  @IsString()
  @IsOptional()
  user_name?: string;

  @ApiPropertyOptional({
    type: "string",
    example: "Eshmat",
    description: "Query for search",
  })
  @IsEnum(PaymentStatus)
  @IsOptional()
  status?: PaymentStatus;

  @ApiPropertyOptional({
    type: "string",
    example: "1",
    description: "page",
  })
  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({
    type: "string",
    example: "10",
    description: "limit",
  })
  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  limit?: number;
}
