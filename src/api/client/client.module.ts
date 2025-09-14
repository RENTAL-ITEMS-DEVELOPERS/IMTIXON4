import { Module } from "@nestjs/common";
import { ClientService } from "./client.service";
import { ClientController } from "./client.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Client } from "src/core/entity/client.entity";
import { CryptoService } from "src/infrastructure/crypt/Crypto";
import { TokenService } from "src/infrastructure/token/Token";
import { AuthService } from "../auth/auth.service";
import { EmailService } from "src/infrastructure/mail/email.service";

@Module({
  imports: [TypeOrmModule.forFeature([Client])],
  controllers: [ClientController],
  providers: [
    ClientService,
    CryptoService,
    TokenService,
    AuthService,
    EmailService,
  ],
})
export class ClientModule {}
