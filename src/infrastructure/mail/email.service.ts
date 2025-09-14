import { MailerService } from "@nestjs-modules/mailer";
import { Injectable } from "@nestjs/common";

@Injectable()
export class EmailService {
  constructor(private readonly mailerService: MailerService) {}

  async sendOtpEmail(to: string, name: string, otp: string, ttlMinutes = 10) {
    await this.mailerService.sendMail({
      to,
      from: `"RentalItems" <${process.env.MAIL_FROM}>`,
      subject: "RentalItems OTP kodingiz",
      template: "otp",
      context: {
        name,
        otp,
        ttlMinutes,
      },
    });
  }
}
