import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsString } from "class-validator";

export class ForgetPassDto {
  @ApiProperty({ example: "adham011905@gmail.com" })
  @IsEmail()
  @IsString()
  @IsNotEmpty()
  email: string;
}
