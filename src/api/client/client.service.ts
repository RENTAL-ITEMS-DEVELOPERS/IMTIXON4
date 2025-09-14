import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { CreateClientDto } from "./dto/create-client.dto";
import { UpdateClientDto } from "./dto/update-client.dto";
import { BaseService } from "src/infrastructure/base/base.service";
import { Client } from "src/core/entity/client.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CryptoService } from "src/infrastructure/crypt/Crypto";
import { successRes } from "src/infrastructure/response/success";
import type { IToken } from "src/infrastructure/token/interface";
import { TokenService } from "src/infrastructure/token/Token";
import { Response } from "express";
import { Roles } from "src/common/enum";
import { UpdateWalletDto } from "src/common/dto/update-wallet.dto";
import { EmailService } from "src/infrastructure/mail/email.service";
import type { ClientRepository } from "src/core/repository/client.repository";

@Injectable()
export class ClientService extends BaseService<
  CreateClientDto,
  UpdateClientDto,
  Client
> {
  constructor(
    @InjectRepository(Client) private readonly clientRepo: ClientRepository,
    private readonly crypto: CryptoService,
    private readonly tokenService: TokenService,
    private readonly emailService: EmailService,
  ) {
    super(clientRepo);
  }

  async registerClient(createClientDto: CreateClientDto) {
    const { user_name, phone_number, password } = createClientDto;
    const existsUsername = await this.clientRepo.findOne({
      where: { user_name },
    });
    if (existsUsername) {
      throw new ConflictException("Username already exists");
    }
    const existsPhone = await this.clientRepo.findOne({
      where: { phone_number },
    });
    if (existsPhone) {
      throw new ConflictException("Phone number already exists");
    }
    const hashedPassword = await this.crypto.encrypt(password);
    const newClient = this.clientRepo.create({
      user_name,
      phone_number,
      hashed_password: hashedPassword,
    });
    await this.clientRepo.save(newClient);
    return successRes(newClient, 201);
  }

  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async sendOtpForPasswordReset(email: string) {
    const client = await this.clientRepo.findOne({ where: { email } });
    if (!client) {
      throw new NotFoundException("client with this email not found");
    }

    const otp = this.generateOtp();
    const ttlMinutes = 10;

    client.otp = otp;
    client.otpExpiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);
    await this.clientRepo.save(client);

    await this.emailService.sendOtpEmail(
      email,
      client.user_name,
      otp,
      ttlMinutes,
    );

    return { message: "OTP sent to email for password reset" };
  }

  async confirmOtp(email: string, otp: string) {
    const client = await this.clientRepo.findOne({ where: { email } });
    if (!client) {
      throw new NotFoundException("client not found");
    }

    if (!client.otp || !client.otpExpiresAt) {
      throw new BadRequestException("OTP not found. Request a new one.");
    }

    if (new Date() > client.otpExpiresAt) {
      client.otp = null;
      client.otpExpiresAt = null;
      await this.clientRepo.save(client);
      throw new BadRequestException("OTP expired. Request a new one.");
    }

    if (client.otp !== otp) {
      throw new BadRequestException("Incorrect OTP");
    }

    client.otp = null;
    client.otpExpiresAt = null;
    await this.clientRepo.save(client);

    return { message: "OTP confirmed successfully" };
  }

  async resetPassword(email: string, newPassword: string) {
    const client = await this.clientRepo.findOne({ where: { email } });
    if (!client) {
      throw new NotFoundException("client not found");
    }

    const hashedPassword = await this.crypto.encrypt(newPassword);
    client.hashed_password = hashedPassword;

    await this.clientRepo.save(client);
    return { message: "Password reset successfully" };
  }

  async resendOtp(email: string) {
    const client = await this.clientRepo.findOne({ where: { email } });
    if (!client) {
      throw new NotFoundException("client not found");
    }

    const otp = this.generateOtp();
    const ttlMinutes = 10;

    client.otp = otp;
    client.otpExpiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);
    await this.clientRepo.save(client);

    await this.emailService.sendOtpEmail(
      email,
      client.user_name,
      otp,
      ttlMinutes,
    );

    return { message: "OTP resent to email" };
  }

  async signIn(signInDto: CreateClientDto, res: Response) {
    const { user_name, password } = signInDto;
    const client = await this.clientRepo.findOne({ where: { user_name } });
    const isMatchPassword = await this.crypto.decrypt(
      password,
      client?.hashed_password || "",
    );
    if (!client || !isMatchPassword) {
      throw new BadRequestException("Username or password incorrect");
    }
    const payload: IToken = {
      id: client.id,
      isActive: client.is_active,
      role: client.role,
    };
    const accessToken = await this.tokenService.accessToken(payload);
    const refreshToken = await this.tokenService.refreshToken(payload);
    await this.tokenService.writeCookie(res, "clientToken", refreshToken, 15);
    return successRes({ token: accessToken });
  }

  async updateClient(
    id: string,
    updateClientDto: UpdateClientDto,
    user: IToken,
  ) {
    const { user_name, phone_number, password, is_active } = updateClientDto;
    const client = await this.clientRepo.findOne({ where: { id } });
    if (!client) {
      throw new ConflictException("Client not found");
    }
    if (user_name) {
      const existsUsername = await this.clientRepo.findOne({
        where: { user_name },
      });
      if (existsUsername && existsUsername.id !== id) {
        throw new ConflictException("Username already exists");
      }
    }
    if (phone_number) {
      const existsPhone = await this.clientRepo.findOne({
        where: { phone_number },
      });
      if (existsPhone && existsPhone.id !== id) {
        throw new ConflictException("Phone number already exists");
      }
    }
    let hashedPassword = client?.hashed_password;
    let isActive = client.is_active;
    if (user.role === Roles.SUPERADMIN) {
      if (password) {
        hashedPassword = await this.crypto.encrypt(password);
      }
      if (is_active != null) {
        isActive = is_active;
      }
    }
    await this.clientRepo.update(
      { id },
      {
        user_name,
        is_active: isActive,
        hashed_password: hashedPassword,
        phone_number,
      },
    );
    return this.findOneById(id);
  }

  async updateWallet(id: string, updateWalletDto: UpdateWalletDto) {
    const { card_number, sum } = updateWalletDto;

    const client = await this.clientRepo.findOne({ where: { id } });
    if (!client) {
      throw new NotFoundException("Client not found");
    }

    if (!card_number || card_number.length < 12) {
      throw new BadRequestException("Invalid card number");
    }
    client.wallet = +client.wallet + sum;
    await this.clientRepo.save(client);

    return successRes(client);
  }
}
