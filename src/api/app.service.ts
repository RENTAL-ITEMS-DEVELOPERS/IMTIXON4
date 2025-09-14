import { NestFactory } from "@nestjs/core";
import cookieParser from "cookie-parser";
import { HttpStatus, ValidationPipe } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

import { AppModule } from "./app.module";
import { config } from "src/config";
import { AllExceptionFilter } from "src/infrastructure/exception/AllException";

export class Application {
  static async main(): Promise<void> {
    const app = await NestFactory.create(AppModule);

    app.useGlobalFilters(new AllExceptionFilter());

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      }),
    );

    app.use(cookieParser());

    const api = "api/v1";
    app.setGlobalPrefix(api);
    const configSwagger = new DocumentBuilder()
      .setTitle("Rental Items")
      .setVersion("1.0.0")
      .addBearerAuth({
        type: "http",
        scheme: "Bearer",
        in: "Header",
      })
      .build();
    const documentFactory = SwaggerModule.createDocument(app, configSwagger);
    SwaggerModule.setup(api, app, documentFactory);

    app.listen(config.PORT, () =>
      console.log(`Server running on http://localhost:${config.PORT}/api/v1`),
    );

    process.on("uncaughtException", (err) => {
      console.error("Uncaught Exception:", err);
    });

    process.on("unhandledRejection", (reason, promise) => {
      console.error("Unhandled Rejection at:", promise, "reason:", reason);
    });
  }
}
