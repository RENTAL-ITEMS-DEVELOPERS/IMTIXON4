import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class CreatePenaltyDto {
  @IsUUID()
  @IsNotEmpty()
  orderId: string;

  @IsUUID()
  @IsOptional()
  clientId?: string;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsNumber()
  @Min(0)
  days: number;

  @IsString()
  @IsOptional()
  reason?: string;
}
