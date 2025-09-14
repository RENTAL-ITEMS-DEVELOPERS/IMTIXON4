import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { config } from "src/config";
import { AdminModule } from "./admin/admin.module";
import { JwtModule } from "@nestjs/jwt";
import { AuthModule } from "./auth/auth.module";
// import { LessorModule } from './lessor/lessor.module';
// import { ClientModule } from './client/client.module';
import { OrderModule } from './order/order.module';
import { PaymentModule } from './payment/payment.module';
// import { ItemModule } from './item/item.module';
// import { ImagesModule } from './images/images.module';
// import { CategoryModule } from './category/category.module';
// import { PenaltyModule } from './penalty/penalty.module';
// import { NotificationModule } from './notification/notification.module';
import { MailerModule } from "@nestjs-modules/mailer";
import { HandlebarsAdapter } from "@nestjs-modules/mailer/dist/adapters/handlebars.adapter";
import { join } from "path";

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: "postgres",
      url: config.DB_URL,
      synchronize: config.DB_SYNC,
      entities: ["dist/core/entity/*.entity{.ts,.js}"],
      autoLoadEntities: true,
    }),
    JwtModule.register({
      global: true,
    }),
    MailerModule.forRoot({
      transport: {
        host: config.API.HOST,
        port: config.API.PORT,
        auth: {
          user: config.API.USER,
          pass: config.API.PASS,
        },
      },
      defaults: {
        from: `"RentalItems" <${process.env.SMTP_USER}>`,
      },
      template: {
        dir: join(process.cwd(), "src", "infrastructure", "mail", "templates"),
        adapter: new HandlebarsAdapter(),
        options: {
          strict: true,
        },
      },
    }),
    AuthModule,
    AdminModule,
    // LessorModule,
    // ClientModule,
    OrderModule,
    PaymentModule,
    // ItemModule,
    // ImagesModule,
    // CategoryModule,
    // PenaltyModule,
    // NotificationModule,
    MailerModule,
  ],
})
export class AppModule {}
