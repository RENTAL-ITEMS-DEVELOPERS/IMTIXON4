import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsNumber, Min } from "class-validator";

export class UpdateWalletDto {
  @ApiProperty()
  @IsString()
  card_number: string;

  @ApiProperty()
  @IsNumber()
  @Min(1)
  sum: number;
}
