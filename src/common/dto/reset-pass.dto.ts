import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsStrongPassword } from "class-validator";

export class ResetPassDto {
  @ApiProperty({ example: "ali@gmail.com" })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: "Ali1234!" })
  @IsStrongPassword()
  @IsNotEmpty()
  newPassword: string;
}
