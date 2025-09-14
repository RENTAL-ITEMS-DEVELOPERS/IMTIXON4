import { Module } from "@nestjs/common";
import { LessorService } from "./lessor.service";
import { LessorController } from "./lessor.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Lessor } from "src/core/entity/lessor.entity";
import { CryptoService } from "src/infrastructure/crypt/Crypto";
import { TokenService } from "src/infrastructure/token/Token";
import { AuthService } from "../auth/auth.service";
import { EmailService } from "src/infrastructure/mail/email.service";

@Module({
  imports: [TypeOrmModule.forFeature([Lessor])],
  controllers: [LessorController],
  providers: [
    LessorService,
    CryptoService,
    TokenService,
    AuthService,
    EmailService,
  ],
})
export class LessorModule {}
