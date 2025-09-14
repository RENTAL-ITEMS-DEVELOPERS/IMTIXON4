import { ApiProperty } from "@nestjs/swagger";
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from "class-validator";
import { OrderStatus } from "src/common/enum/index";

export class CreateOrderDto {
  @ApiProperty()
  @IsNumber()
  @IsOptional()
  amount_sum?: number;

  @ApiProperty()
  @Min(1)
  @IsInt()
  @IsNotEmpty()
  quantity: number;

  @ApiProperty()
  @MaxLength(255)
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiProperty()
  @IsEnum(OrderStatus)
  @IsOptional()
  status?: OrderStatus;

  @ApiProperty()
  @IsDateString()
  @IsNotEmpty()
  start_date: Date;

  @ApiProperty()
  @IsDateString()
  @IsNotEmpty()
  end_date: Date;

  @ApiProperty()
  @IsOptional()
  @IsDateString()
  returned_at?: Date;

  @ApiProperty()
  @IsBoolean()
  @IsOptional()
  is_active?: boolean;

  @ApiProperty()
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty()
  @IsUUID()
  @IsString()
  @IsNotEmpty()
  client_id: string;

  @ApiProperty()
  @IsUUID()
  @IsString()
  @IsNotEmpty()
  item_id: string;

  @ApiProperty()
  @IsUUID()
  @IsOptional()
  payment_id?: string;

  @ApiProperty()
  @IsUUID()
  @IsOptional()
  penalty_id?: string;
}

export class ExtendOrderDto {
  @ApiProperty({ example: new Date(), description: "New extended date" })
  @IsDateString({}, { message: "extraDays must be a valid date string" })
  @IsNotEmpty()
  extraDays: Date;
}
