import { ApiProperty } from "@nestjs/swagger";
import {
  IsString,
  IsNotEmpty,
  IsStrongPassword,
  IsEmail,
} from "class-validator";

export class CreateClientDto {
  @ApiProperty()
  @IsString()
  user_name: string;

  @ApiProperty()
  @IsEmail()
  @IsString()
  email: string;

  @ApiProperty()
  @IsString()
  phone_number: string;

  @ApiProperty()
  @IsStrongPassword()
  @IsString()
  @IsNotEmpty()
  password: string;
}
