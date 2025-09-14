import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { CreateLessorDto } from "./dto/create-lessor.dto";
import { UpdateLessorDto } from "./dto/update-lessor.dto";
import { BaseService } from "src/infrastructure/base/base.service";
import { Lessor } from "src/core/entity/lessor.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { config } from "process";
import { CryptoService } from "src/infrastructure/crypt/Crypto";
import { TokenService } from "src/infrastructure/token/Token";
import { successRes } from "src/infrastructure/response/success";
import { ISuccess } from "src/infrastructure/response/success.interface";
import { Roles } from "src/common/enum";
import { IToken } from "src/infrastructure/token/interface";
import { Response } from "express";
import { UpdateWalletDto } from "src/common/dto/update-wallet.dto";
import { EmailService } from "src/infrastructure/mail/email.service";
import type { LessorRepository } from "src/core/repository/lessor.repository";

@Injectable()
export class LessorService extends BaseService<
  CreateLessorDto,
  UpdateLessorDto,
  Lessor
> {
  constructor(
    @InjectRepository(Lessor) private readonly lessorRepo: LessorRepository,
    private readonly crypto: CryptoService,
    private readonly tokenService: TokenService,
    private readonly emailService: EmailService,
  ) {
    super(lessorRepo);
  }
  async registerLessor(createLessorDto: CreateLessorDto) {
    const { user_name, phone_number, password } = createLessorDto;
    const existsUsername = await this.lessorRepo.findOne({
      where: { user_name },
    });
    if (existsUsername) {
      throw new ConflictException("Username already exists");
    }
    const existsPhone = await this.lessorRepo.findOne({
      where: { phone_number },
    });
    if (existsPhone) {
      throw new ConflictException("Phone number already exists");
    }
    const hashedPassword = await this.crypto.encrypt(password);
    const newLessor = this.lessorRepo.create({
      user_name,
      phone_number,
      hashed_password: hashedPassword,
    });
    await this.lessorRepo.save(newLessor);
    return successRes(newLessor, 201);
  }

  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit
  }

  async sendOtpForPasswordReset(email: string) {
    const lessor = await this.lessorRepo.findOne({ where: { email } });
    if (!lessor) {
      throw new NotFoundException("Lessor with this email not found");
    }

    const otp = this.generateOtp();
    const ttlMinutes = 10;

    lessor.otp = otp;
    lessor.otpExpiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);
    await this.lessorRepo.save(lessor);

    await this.emailService.sendOtpEmail(
      email,
      lessor.user_name,
      otp,
      ttlMinutes,
    );

    return { message: "OTP sent to email for password reset" };
  }

  async confirmOtp(email: string, otp: string) {
    const lessor = await this.lessorRepo.findOne({ where: { email } });
    if (!lessor) {
      throw new NotFoundException("Lessor not found");
    }

    if (!lessor.otp || !lessor.otpExpiresAt) {
      throw new BadRequestException("OTP not found. Request a new one.");
    }

    if (new Date() > lessor.otpExpiresAt) {
      lessor.otp = null;
      lessor.otpExpiresAt = null;
      await this.lessorRepo.save(lessor);
      throw new BadRequestException("OTP expired. Request a new one.");
    }

    if (lessor.otp !== otp) {
      throw new BadRequestException("Incorrect OTP");
    }

    lessor.otp = null;
    lessor.otpExpiresAt = null;
    await this.lessorRepo.save(lessor);

    return { message: "OTP confirmed successfully" };
  }

  async resetPassword(email: string, newPassword: string) {
    const lessor = await this.lessorRepo.findOne({ where: { email } });
    if (!lessor) {
      throw new NotFoundException("Lessor not found");
    }

    const hashedPassword = await this.crypto.encrypt(newPassword);
    lessor.hashed_password = hashedPassword;

    await this.lessorRepo.save(lessor);
    return { message: "Password reset successfully" };
  }

  async resendOtp(email: string) {
    const lessor = await this.lessorRepo.findOne({ where: { email } });
    if (!lessor) {
      throw new NotFoundException("Lessor not found");
    }

    const otp = this.generateOtp();
    const ttlMinutes = 10;

    lessor.otp = otp;
    lessor.otpExpiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);
    await this.lessorRepo.save(lessor);

    await this.emailService.sendOtpEmail(
      email,
      lessor.user_name,
      otp,
      ttlMinutes,
    );

    return { message: "OTP resent to email" };
  }

  async signIn(signInDto: CreateLessorDto, res: Response) {
    const { user_name, password } = signInDto;
    const lessor = await this.lessorRepo.findOne({ where: { user_name } });
    const isMatchPassword = await this.crypto.decrypt(
      password,
      lessor?.hashed_password || "",
    );
    if (!lessor || !isMatchPassword) {
      throw new BadRequestException("Username or password incorrect");
    }
    const payload: IToken = {
      id: lessor.id,
      isActive: lessor.is_active,
      role: lessor.role,
    };
    const accessToken = await this.tokenService.accessToken(payload);
    const refreshToken = await this.tokenService.refreshToken(payload);
    await this.tokenService.writeCookie(res, "lessorToken", refreshToken, 15);
    return successRes({ token: accessToken });
  }

  async updateLessor(
    id: string,
    updateLessorDto: UpdateLessorDto,
    user: IToken,
  ) {
    const { user_name, phone_number, password, is_active } = updateLessorDto;
    const lessor = await this.lessorRepo.findOne({ where: { id } });
    if (!lessor) {
      throw new ConflictException("Lessor not found");
    }
    if (user_name) {
      const existsUsername = await this.lessorRepo.findOne({
        where: { user_name },
      });
      if (existsUsername && existsUsername.id !== id) {
        throw new ConflictException("Username already exists");
      }
    }
    if (phone_number) {
      const existsPhone = await this.lessorRepo.findOne({
        where: { phone_number },
      });
      if (existsPhone && existsPhone.id !== id) {
        throw new ConflictException("Phone number already exists");
      }
    }
    let hashedPassword = lessor?.hashed_password;
    let isActive = lessor.is_active;
    if (user.role === Roles.SUPERADMIN) {
      if (password) {
        hashedPassword = await this.crypto.encrypt(password);
      }
      if (is_active != null) {
        isActive = is_active;
      }
    }
    await this.lessorRepo.update(
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

    const lessor = await this.lessorRepo.findOne({ where: { id } });
    if (!lessor) {
      throw new NotFoundException("Lessor not found");
    }

    if (!card_number || card_number.length < 12) {
      throw new BadRequestException("Invalid card number");
    }

    lessor.wallet = +lessor.wallet + sum;
    await this.lessorRepo.save(lessor);

    return successRes(lessor);
  }
}
