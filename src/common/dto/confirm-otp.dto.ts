import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsString, Length } from "class-validator";

export class ConfirmOtpDto {
  @ApiProperty({ example: "ali@gmail.com" })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: "123456" })
  @IsString()
  @Length(6, 6, { message: "OTP 6 xonali bolishi kerak" })
  otp: string;
}
