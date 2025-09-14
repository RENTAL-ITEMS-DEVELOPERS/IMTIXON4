import { Module } from "@nestjs/common";
import { AdminService } from "./admin.service";
import { AdminController } from "./admin.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AdminEntity } from "src/core/entity/admin.entity";
import { CryptoService } from "src/infrastructure/crypt/Crypto";
import { TokenService } from "src/infrastructure/token/Token";
import { AuthModule } from "../auth/auth.module";
import { EmailService } from "src/infrastructure/mail/email.service";

@Module({
  imports: [TypeOrmModule.forFeature([AdminEntity]), AuthModule],
  controllers: [AdminController],
  providers: [AdminService, CryptoService, TokenService, EmailService],
})
export class AdminModule {}
