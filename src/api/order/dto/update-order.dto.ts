import { PartialType } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { IsOptional } from 'class-validator';
import { CreateOrderDto } from './create-order.dto';

export class UpdateOrderDto extends PartialType(CreateOrderDto) {
  @IsOptional()
  @Exclude()
  amount_sum?: number | undefined;

  @IsOptional()
  @Exclude()
  client_id?: string | undefined;

  @IsOptional()
  @Exclude()
  item_id?: string | undefined;
}
