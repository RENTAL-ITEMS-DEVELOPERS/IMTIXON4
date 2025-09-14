import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  OnModuleInit,
} from "@nestjs/common";
import { CreateAdminDto } from "./dto/create-admin.dto";
import { UpdateAdminDto } from "./dto/update-admin.dto";
import { InjectRepository } from "@nestjs/typeorm";
import { AdminEntity } from "src/core/entity/admin.entity";
import type { AdminRepository } from "src/core/repository/admin.repository";
import { BaseService } from "src/infrastructure/base/base.service";
import { Roles } from "src/common/enum";
import { config } from "src/config";
import { CryptoService } from "src/infrastructure/crypt/Crypto";
import { successRes } from "src/infrastructure/response/success";
import { TokenService } from "src/infrastructure/token/Token";
import { IToken } from "src/infrastructure/token/interface";
import { Response } from "express";
import { EmailService } from "src/infrastructure/mail/email.service";
import { ForgetPassDto } from "src/common/dto/forget-pass.dto";

@Injectable()
export class AdminService
  extends BaseService<CreateAdminDto, UpdateAdminDto, AdminEntity>
  implements OnModuleInit
{
  constructor(
    @InjectRepository(AdminEntity) private readonly adminRepo: AdminRepository,
    private readonly crypto: CryptoService,
    private readonly tokenService: TokenService,
    private readonly emailService: EmailService,
  ) {
    super(adminRepo);
  }

  async onModuleInit(): Promise<void> {
    try {
      const existsSuperadmin = await this.adminRepo.findOne({
        where: { role: Roles.SUPERADMIN },
      });
      const hashedPassword = await this.crypto.encrypt(config.ADMIN_PASSWORD);
      if (!existsSuperadmin) {
        const superadmin = this.adminRepo.create({
          username: config.ADMIN_USERNAME,
          email: config.ADMIN_EMAIL,
          hashed_password: hashedPassword,
          role: Roles.SUPERADMIN,
        });
        await this.adminRepo.save(superadmin);
        console.log("Super admin created successfully");
      }
    } catch (error) {
      throw new InternalServerErrorException("Error on creaeting super admin");
    }
  }

  async createAdmin(creteAdminDto: CreateAdminDto) {
    const { username, password } = creteAdminDto;
    const existsUsername = await this.adminRepo.findOne({
      where: { username },
    });
    if (existsUsername) {
      throw new ConflictException("Username already exists");
    }
    const hashedPassword = await this.crypto.encrypt(password);
    const newAdmin = this.adminRepo.create({
      username,
      hashed_password: hashedPassword,
    });
    await this.adminRepo.save(newAdmin);
    return successRes(newAdmin, 201);
  }

  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async sendOtpForPasswordReset(email: string) {
    const admin = await this.adminRepo.findOne({ where: { email } });
    if (!admin) {
      throw new NotFoundException("admin with this email not found");
    }

    const otp = this.generateOtp();
    const ttlMinutes = 10;

    admin.otp = otp;
    admin.otpExpiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);
    await this.adminRepo.save(admin);
    console.log(otp, admin.otpExpiresAt);

    await this.emailService.sendOtpEmail(
      email,
      admin.username,
      otp,
      ttlMinutes,
    );

    return { message: "OTP sent to email for password reset" };
  }

  async confirmOtp(email: string, otp: string) {
    const admin = await this.adminRepo.findOne({ where: { email } });
    if (!admin) {
      throw new NotFoundException("admin not found");
    }

    if (!admin.otp || !admin.otpExpiresAt) {
      throw new BadRequestException("OTP not found. Request a new one.");
    }

    if (new Date() > admin.otpExpiresAt) {
      admin.otp = null;
      admin.otpExpiresAt = null;
      await this.adminRepo.save(admin);
      throw new BadRequestException("OTP expired. Request a new one.");
    }

    if (admin.otp !== otp) {
      throw new BadRequestException("Incorrect OTP");
    }

    admin.otp = null;
    admin.otpExpiresAt = null;
    await this.adminRepo.save(admin);

    return { message: "OTP confirmed successfully" };
  }

  async resetPassword(email: string, newPassword: string) {
    const admin = await this.adminRepo.findOne({ where: { email } });
    if (!admin) {
      throw new NotFoundException("admin not found");
    }

    const hashedPassword = await this.crypto.encrypt(newPassword);
    admin.hashed_password = hashedPassword;

    await this.adminRepo.save(admin);
    return { message: "Password reset successfully" };
  }

  async resendOtp(email: string) {
    const admin = await this.adminRepo.findOne({ where: { email } });
    if (!admin) {
      throw new NotFoundException("admin not found");
    }

    const otp = this.generateOtp();
    const ttlMinutes = 10;

    admin.otp = otp;
    admin.otpExpiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);
    await this.adminRepo.save(admin);

    await this.emailService.sendOtpEmail(
      email,
      admin.username,
      otp,
      ttlMinutes,
    );

    return { message: "OTP resent to email" };
  }

  async signIn(signInDto: CreateAdminDto, res: Response) {
    const { username, password } = signInDto;
    const admin = await this.adminRepo.findOne({ where: { username } });
    const isMatchPassword = await this.crypto.decrypt(
      password,
      admin?.hashed_password || "",
    );
    if (!admin || !isMatchPassword) {
      throw new BadRequestException("Username or password incorrect");
    }
    const payload: IToken = {
      id: admin.id,
      isActive: admin.is_active,
      role: admin.role,
    };
    const accessToken = await this.tokenService.accessToken(payload);
    const refreshToken = await this.tokenService.refreshToken(payload);
    await this.tokenService.writeCookie(res, "adminToken", refreshToken, 15);
    return successRes({ token: accessToken });
  }

  async updateAdmin(id: string, updateAdminDto: UpdateAdminDto, user: IToken) {
    const { username, password, is_active } = updateAdminDto;
    const admin = await this.adminRepo.findOne({ where: { id } });
    if (!admin) {
      throw new NotFoundException("Admin not found");
    }
    if (username) {
      const existsUsername = await this.adminRepo.findOne({
        where: { username },
      });
      if (existsUsername && existsUsername.id !== id) {
        throw new ConflictException("Username already exists");
      }
    }
    let hashedPassword = admin?.hashed_password;
    let isActive = admin.is_active;
    if (user.role === Roles.SUPERADMIN) {
      if (password) {
        hashedPassword = await this.crypto.encrypt(password);
      }
      if (is_active) {
        isActive = is_active;
      }
    }
    await this.adminRepo.update(
      { id },
      { username, is_active: isActive, hashed_password: hashedPassword },
    );
    return this.findOneById(id);
  }
}
