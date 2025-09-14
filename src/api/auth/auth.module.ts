import { Module } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { TokenService } from "src/infrastructure/token/Token";

@Module({
  providers: [AuthService, TokenService],
  exports: [AuthService],
})
export class AuthModule {}
