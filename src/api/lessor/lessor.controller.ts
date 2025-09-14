import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
  Res,
  UseGuards,
  Query,
} from "@nestjs/common";
import { CreateLessorDto } from "./dto/create-lessor.dto";
import { UpdateLessorDto } from "./dto/update-lessor.dto";
import { LessorService } from "./lessor.service";
import { ApiBearerAuth } from "@nestjs/swagger";
import {
  SwagFailedRes,
  SwagSuccessRes,
} from "src/common/decorator/swagger-res.decorator";
import { lessorData } from "src/common/document/lessorSwagger";
import { AccessRoles } from "src/common/decorator/roles.decorator";
import { Roles } from "src/common/enum";
import type { IToken } from "src/infrastructure/token/interface";
import { GetRequestUser } from "src/common/decorator/get-request-user.decorator";
import type { Response } from "express";
import { CookieGetter } from "src/common/decorator/cookie-getter.decorator";
import { AuthService } from "../auth/auth.service";
import { AuthGuard } from "src/common/guard/auth.guard";
import { RolesGuard } from "src/common/guard/role.guard";
import { ILike } from "typeorm";
import { QueryPaginationDto } from "src/common/dto/query-pagination.dto";
import { UpdateWalletDto } from "src/common/dto/update-wallet.dto";
import { ResetPassDto } from "src/common/dto/reset-pass.dto";
import { ConfirmOtpDto } from "src/common/dto/confirm-otp.dto";
import { ForgetPassDto } from "src/common/dto/forget-pass.dto";

@Controller("lessor")
export class LessorController {
  constructor(
    private readonly lessorService: LessorService,
    private readonly authService: AuthService,
  ) {}

  @SwagSuccessRes(
    "Create Lessor",
    200,
    "Lessor creating successfuling",
    200,
    "success",
    { ...lessorData },
  )
  @SwagFailedRes(500, "Error on creating Lessor", 500, "Internal server error")
  @Post()
  create(@Body() createLessorDto: CreateLessorDto) {
    return this.lessorService.registerLessor(createLessorDto);
  }

  @Post("forgot-password/send-otp")
  sendOtp(@Body() body: ForgetPassDto) {
    return this.lessorService.sendOtpForPasswordReset(body.email);
  }

  @Post("forgot-password/confirm-otp")
  confirmOtp(@Body() body: ConfirmOtpDto) {
    return this.lessorService.confirmOtp(body.email, body.otp);
  }

  @Post("forgot-password/reset")
  resetPassword(@Body() body: ResetPassDto) {
    return this.lessorService.resetPassword(body.email, body.newPassword);
  }

  @Post("forgot-password/resend-otp")
  resendOtp(@Body() body: ForgetPassDto) {
    return this.lessorService.resendOtp(body.email);
  }

  @SwagSuccessRes("Lessor sign in", 200, "lessor sign in", 200, "success", {
    ...lessorData,
  })
  @SwagFailedRes(400, "Unauthorizet", 400, "Refresh token expired")
  @Post("signin")
  signin(
    @Body() signInDto: CreateLessorDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.lessorService.signIn(signInDto, res);
  }

  @SwagSuccessRes(
    "Get new access token",
    200,
    "New access token get successfull",
    200,
    "success",
    { ...lessorData },
  )
  @SwagFailedRes(400, "Unauthorizet", 400, "Refresh token expired")
  @Post("token")
  newToken(@CookieGetter("lessorToken") token: string) {
    return this.authService.newToken(this.lessorService.getRepository, token);
  }

  @SwagSuccessRes(
    "Sing out lessory",
    200,
    "Lessor singet out successfully",
    200,
    "success",
    { ...lessorData },
  )
  @SwagFailedRes(400, "Unauthorizet", 400, "Unauthorizet")
  @Post("signout")
  signOut(
    @CookieGetter("lessorToken") token: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.signOut(
      this.lessorService.getRepository,
      token,
      res,
      "lessorToken",
    );
  }

  @SwagSuccessRes(
    "Get all lessors with pagination",
    200,
    "All lessors get successfully with pagination",
    200,
    "success",
    { ...lessorData },
  )
  @SwagFailedRes(500, "Error on get lessors", 500, "Internal server error")
  @UseGuards(AuthGuard, RolesGuard)
  @AccessRoles(Roles.SUPERADMIN, Roles.ADMIN)
  @Get()
  @ApiBearerAuth()
  findAllWithPagination(@Query() queryDto: QueryPaginationDto) {
    const { query, page, limit } = queryDto;
    const where = query ? { user_name: ILike(`%${query}%`) } : {};
    return this.lessorService.findAllWithPagination({
      where,
      order: { createdAt: "DESC" },
      select: {
        id: true,
        user_name: true,
        is_active: true,
        wallet: true,
        role: true,
      },
      skip: page,
      take: limit,
    });
  }

  @SwagSuccessRes(
    "Get all lessors",
    200,
    "All lessors get successfully",
    200,
    "success",
    { ...lessorData },
  )
  @SwagFailedRes(500, "Error on get lessors", 500, "internal server error")
  @UseGuards(AuthGuard, RolesGuard)
  @AccessRoles(Roles.SUPERADMIN, Roles.ADMIN)
  @Get("all")
  @ApiBearerAuth()
  findAll() {
    return this.lessorService.findAll({
      where: { role: Roles.LESSOR },
      order: { createdAt: "DESC" },
      select: {
        id: true,
        user_name: true,
        is_active: true,
        wallet: true,
      },
    });
  }

  @SwagSuccessRes(
    "Get lessor by id",
    200,
    "Lessors get by id successfully",
    200,
    "success",
    { ...lessorData },
  )
  @SwagFailedRes(500, "Error on get lessor by id", 500, "internal server error")
  @UseGuards(AuthGuard, RolesGuard)
  @AccessRoles(Roles.SUPERADMIN, Roles.ADMIN, "ID")
  @Get(":id")
  @ApiBearerAuth()
  findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.lessorService.findOneById(id, {
      where: { role: Roles.LESSOR },
    });
  }

  @SwagSuccessRes(
    "Update lessor by id",
    200,
    "Update lessor by id successfully",
    200,
    "success",
    { ...lessorData },
  )
  @SwagFailedRes(
    500,
    "Error on update lessor by id",
    500,
    "internal server error",
  )
  @UseGuards(AuthGuard, RolesGuard)
  @AccessRoles(Roles.SUPERADMIN, Roles.ADMIN, "ID")
  @Patch(":id")
  @ApiBearerAuth()
  update(
    @GetRequestUser("user") user: IToken,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() updateLessorDto: UpdateLessorDto,
  ) {
    return this.lessorService.updateLessor(id, updateLessorDto, user);
  }

  @SwagSuccessRes(
    "Update wallet of lessor by id",
    200,
    "Wallet of lessor update successfully",
    200,
    "success",
    { ...lessorData },
  )
  @SwagFailedRes(
    500,
    "Error on updating wallet of lessor by id",
    500,
    "internal server error",
  )
  @UseGuards(AuthGuard, RolesGuard)
  @AccessRoles(Roles.SUPERADMIN, Roles.ADMIN, "ID")
  @Patch(":id/wallet")
  @ApiBearerAuth()
  updateWallet(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() updateWalletDto: UpdateWalletDto,
  ) {
    return this.lessorService.updateWallet(id, updateWalletDto);
  }

  @SwagSuccessRes(
    "Delete lessor by id",
    200,
    "lessor delete by id successfully",
    200,
    "success",
    {},
  )
  @SwagFailedRes(
    500,
    "Error on deleting lessor by id",
    500,
    "internal server error",
  )
  @UseGuards(AuthGuard, RolesGuard)
  @AccessRoles(Roles.SUPERADMIN, Roles.ADMIN)
  @Delete(":id")
  @ApiBearerAuth()
  remove(@Param("id", ParseUUIDPipe) id: string) {
    return this.lessorService.delete(id);
  }
}
