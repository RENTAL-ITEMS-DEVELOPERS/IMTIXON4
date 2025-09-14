import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsNumber, IsOptional, IsString } from "class-validator";
import { Type } from "class-transformer";

export class QueryPaginationDto {
  @ApiPropertyOptional({
    type: "string",
    example: "Eshmat",
    description: "Query for search",
  })
  @IsString()
  @IsOptional()
  query?: string;

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
