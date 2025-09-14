import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Res,
  HttpStatus,
  UseGuards,
  Query,
  ParseUUIDPipe,
  ForbiddenException,
} from "@nestjs/common";
import { AdminService } from "./admin.service";
import { CreateAdminDto } from "./dto/create-admin.dto";
import { UpdateAdminDto } from "./dto/update-admin.dto";
import type { Response } from "express";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { adminData } from "src/common/document/adminSwagger";
import { CookieGetter } from "src/common/decorator/cookie-getter.decorator";
import { AuthService } from "../auth/auth.service";
import { AuthGuard } from "src/common/guard/auth.guard";
import { RolesGuard } from "src/common/guard/role.guard";
import { AccessRoles } from "src/common/decorator/roles.decorator";
import { Roles } from "src/common/enum";
import { QueryPaginationDto } from "src/common/dto/query-pagination.dto";
import { ILike } from "typeorm";
import { GetRequestUser } from "src/common/decorator/get-request-user.decorator";
import type { IToken } from "src/infrastructure/token/interface";
import { ConfirmOtpDto } from "../../common/dto/confirm-otp.dto";
import { ResetPassDto } from "../../common/dto/reset-pass.dto";
import { ForgetPassDto } from "src/common/dto/forget-pass.dto";

@ApiTags("Admin")
@Controller("admin")
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly authService: AuthService,
  ) {}

  @ApiOperation({
    summary: "Create admin",
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: "Admin created",
    schema: {
      example: {
        statusCode: 201,
        message: "success",
        data: adminData,
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: "Failed creating admin",
    schema: {
      example: {
        statusCode: 400,
        error: {
          message: "Username already exists",
        },
      },
    },
  })
  @UseGuards(AuthGuard, RolesGuard)
  @AccessRoles(Roles.SUPERADMIN)
  @Post()
  @ApiBearerAuth()
  create(@Body() createAdminDto: CreateAdminDto) {
    return this.adminService.createAdmin(createAdminDto);
  }

  @Post("forgot-password/send-otp")
  sendOtp(@Body() body: ForgetPassDto) {
    return this.adminService.sendOtpForPasswordReset(body.email);
  }

  @Post("forgot-password/confirm-otp")
  confirmOtp(@Body() body: ConfirmOtpDto) {
    return this.adminService.confirmOtp(body.email, body.otp);
  }

  @Post("forgot-password/reset")
  resetPassword(@Body() body: ResetPassDto) {
    return this.adminService.resetPassword(body.email, body.newPassword);
  }

  @Post("forgot-password/resend-otp")
  resendOtp(@Body() body: ForgetPassDto) {
    return this.adminService.resendOtp(body.email);
  }

  @ApiOperation({
    summary: "Sign in admin",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Admin sign in",
    schema: {
      example: {
        statusCode: 200,
        message: "success",
        data: {
          token: "lkasdfjaskldjfasdifjm2ohnkb42309judsfkanfoasdjf",
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: "Unauthorized",
    schema: {
      example: {
        statusCode: 400,
        error: {
          message: "Refresh token expired",
        },
      },
    },
  })
  @Post("signin")
  signin(
    @Body() signInDto: CreateAdminDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.adminService.signIn(signInDto, res);
  }

  @ApiOperation({
    summary: "Get new access token",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "New access token get successfully",
    schema: {
      example: {
        statusCode: 200,
        message: "success",
        data: {
          token: "aslksfjo2i3n4n2309idsfn2i3jo423lj423kj",
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: "Unauthorized",
    schema: {
      example: {
        statusCode: 400,
        error: {
          message: "Refresh token expired",
        },
      },
    },
  })
  @Post("token")
  newToken(@CookieGetter("adminToken") token: string) {
    return this.authService.newToken(this.adminService.getRepository, token);
  }

  @ApiOperation({
    summary: "Sign out admin",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Admin signed out successfully",
    schema: {
      example: {
        statusCode: 200,
        message: "success",
        data: {},
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: "Unauthorized",
    schema: {
      example: {
        statusCode: 400,
        error: {
          message: "Unauthorized",
        },
      },
    },
  })
  @Post("signout")
  signOut(
    @CookieGetter("adminToken") token: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.signOut(
      this.adminService.getRepository,
      token,
      res,
      "adminToken",
    );
  }

  @ApiOperation({
    summary: "Get all admins with pagination",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "All admins get successfully with pagination",
    schema: {
      example: {
        statusCode: 200,
        message: "success",
        data: [
          {
            ...adminData,
          },
        ],
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: "Error on get admins",
    schema: {
      example: {
        statusCode: 500,
        error: {
          message: "Internal server error",
        },
      },
    },
  })
  @UseGuards(AuthGuard, RolesGuard)
  @AccessRoles(Roles.SUPERADMIN)
  @Get()
  @ApiBearerAuth()
  findAllWithPagination(@Query() queryDto: QueryPaginationDto) {
    const { query, page, limit } = queryDto;
    const where = query
      ? { username: ILike(`%${query}%`), role: Roles.ADMIN, is_deleted: false }
      : { role: Roles.ADMIN, is_deleted: false };
    return this.adminService.findAllWithPagination({
      where,
      order: { createdAt: "DESC" },
      select: {
        id: true,
        username: true,
        is_active: true,
      },
      skip: page,
      take: limit,
    });
  }

  @ApiOperation({
    summary: "Get all admins",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "All admins get successfully",
    schema: {
      example: {
        statusCode: 200,
        message: "success",
        data: [
          {
            ...adminData,
          },
        ],
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: "Error on get admins",
    schema: {
      example: {
        statusCode: 500,
        error: {
          message: "Internal server error",
        },
      },
    },
  })
  @UseGuards(AuthGuard, RolesGuard)
  @AccessRoles(Roles.SUPERADMIN)
  @Get("all")
  @ApiBearerAuth()
  findAll() {
    return this.adminService.findAll({
      where: { role: Roles.ADMIN, is_deleted: false },
      order: { createdAt: "DESC" },
      select: {
        id: true,
        username: true,
        is_active: true,
      },
    });
  }

  @ApiOperation({
    summary: "Get admin by id",
  })
  @ApiParam({
    name: "id",
    type: "string",
    example: "e6b189ff-1d45-44e9-a252-5a0b48f3678f",
    description: "id of admin",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Admin get by id successfully",
    schema: {
      example: {
        statusCode: 200,
        message: "success",
        data: {
          ...adminData,
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: "Error on get admin by id",
    schema: {
      example: {
        statusCode: 500,
        error: {
          message: "Internal server error",
        },
      },
    },
  })
  @UseGuards(AuthGuard, RolesGuard)
  @AccessRoles(Roles.SUPERADMIN, "ID")
  @Get(":id")
  @ApiBearerAuth()
  findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.adminService.findOneById(id, {
      where: { role: Roles.ADMIN, is_deleted: false },
    });
  }

  @ApiOperation({
    summary: "Update admin by id",
  })
  @ApiParam({
    name: "id",
    type: "string",
    example: "e6b189ff-1d45-44e9-a252-5a0b48f3678f",
    description: "id of admin",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Admin updated by id successfully",
    schema: {
      example: {
        statusCode: 200,
        message: "success",
        data: {
          ...adminData,
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: "Error on updating admin by id",
    schema: {
      example: {
        statusCode: 500,
        error: {
          message: "Internal server error",
        },
      },
    },
  })
  @UseGuards(AuthGuard, RolesGuard)
  @AccessRoles(Roles.SUPERADMIN, "ID")
  @Patch(":id")
  @ApiBearerAuth()
  update(
    @GetRequestUser("user") user: IToken,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() updateAdminDto: UpdateAdminDto,
  ) {
    return this.adminService.updateAdmin(id, updateAdminDto, user);
  }

  @ApiOperation({
    summary: "Delete admin by id (soft)",
  })
  @ApiParam({
    name: "id",
    type: "string",
    example: "e6b189ff-1d45-44e9-a252-5a0b48f3678f",
    description: "id of admin",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Admin deleted by id successfully (soft)",
    schema: {
      example: {
        statusCode: 200,
        message: "success",
        data: {
          ...adminData,
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: "Error on deleting admin by id (soft)",
    schema: {
      example: {
        statusCode: 500,
        error: {
          message: "Internal server error",
        },
      },
    },
  })
  @UseGuards(AuthGuard, RolesGuard)
  @AccessRoles(Roles.SUPERADMIN)
  @Patch("delete/:id")
  @ApiBearerAuth()
  async softDelete(@Param("id", ParseUUIDPipe) id: string) {
    await this.adminService.findOneById(id);
    await this.adminService.getRepository.update({ id }, { is_deleted: true });
    return this.adminService.findOneById(id);
  }

  @ApiOperation({
    summary: "Delete admin by id",
  })
  @ApiParam({
    name: "id",
    type: "string",
    example: "e6b189ff-1d45-44e9-a252-5a0b48f3678f",
    description: "id of admin",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Admin deleted by id successfully",
    schema: {
      example: {
        statusCode: 200,
        message: "success",
        data: {},
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: "Error on deleting admin by id",
    schema: {
      example: {
        statusCode: 500,
        error: {
          message: "Internal server error",
        },
      },
    },
  })
  @UseGuards(AuthGuard, RolesGuard)
  @AccessRoles(Roles.SUPERADMIN)
  @Delete(":id")
  @ApiBearerAuth()
  async remove(@Param("id", ParseUUIDPipe) id: string) {
    const admin = await this.adminService.getRepository.findOne({
      where: { id },
    });
    if (admin && admin.role === Roles.SUPERADMIN) {
      throw new ForbiddenException("Deleting super admin is restricted");
    }
    return this.adminService.delete(id);
  }
}
