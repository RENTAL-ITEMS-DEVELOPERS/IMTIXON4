import { ApiProperty } from "@nestjs/swagger";
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsStrongPassword,
  MinLength,
} from "class-validator";

export class CreateAdminDto {
  @ApiProperty({
    type: "string",
    description: "Username for admin",
    example: "Eshmat1",
  })
  @MinLength(5)
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({
    type: "string",
    description: "Email for admin",
    example: "Eshmat1@gmail.com",
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    type: "string",
    description: "Password for admin",
    example: "Eshmat123!",
  })
  @IsStrongPassword()
  @IsNotEmpty()
  password: string;
}
