import { IsUUID, IsString, Length } from "class-validator";

export class CreateNotificationDto {
  @IsUUID()
  client_id: string;

  @IsString()
  @Length(1, 500)
  message: string;
}
