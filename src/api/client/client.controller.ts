import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
  HttpStatus,
  UseGuards,
  Res,
  Query,
} from "@nestjs/common";
import { clientData } from "src/common/document/clientSwagger";
import { ClientService } from "./client.service";
import { CreateClientDto } from "./dto/create-client.dto";
import { UpdateClientDto } from "./dto/update-client.dto";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
} from "@nestjs/swagger";
import { CookieGetter } from "src/common/decorator/cookie-getter.decorator";
import { AuthService } from "../auth/auth.service";
import { AccessRoles } from "src/common/decorator/roles.decorator";
import { Roles } from "src/common/enum";
import { AuthGuard } from "src/common/guard/auth.guard";
import { RolesGuard } from "src/common/guard/role.guard";
import type { Response } from "express";
import { QueryPaginationDto } from "src/common/dto/query-pagination.dto";
import { ILike } from "typeorm";
import type { IToken } from "src/infrastructure/token/interface";
import { GetRequestUser } from "src/common/decorator/get-request-user.decorator";
import { UpdateWalletDto } from "src/common/dto/update-wallet.dto";
import { ConfirmOtpDto } from "src/common/dto/confirm-otp.dto";
import { ResetPassDto } from "src/common/dto/reset-pass.dto";
import { ForgetPassDto } from "src/common/dto/forget-pass.dto";

@Controller("client")
export class ClientController {
  constructor(
    private readonly clientService: ClientService,
    private readonly authService: AuthService,
  ) {}

  @ApiOperation({
    summary: "Create client",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Client created successfully",
    schema: {
      example: {
        statusCode: 200,
        message: "success",
        data: {
          ...clientData,
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: "Error on creating client",
    schema: {
      example: {
        statusCode: 500,
        error: {
          message: "Internal server error",
        },
      },
    },
  })
  @Post()
  create(@Body() createClientDto: CreateClientDto) {
    return this.clientService.registerClient(createClientDto);
  }

  @Post("forgot-password/send-otp")
  sendOtp(@Body() body: ForgetPassDto) {
    return this.clientService.sendOtpForPasswordReset(body.email);
  }

  @Post("forgot-password/confirm-otp")
  confirmOtp(@Body() body: ConfirmOtpDto) {
    return this.clientService.confirmOtp(body.email, body.otp);
  }

  @Post("forgot-password/reset")
  resetPassword(@Body() body: ResetPassDto) {
    return this.clientService.resetPassword(body.email, body.newPassword);
  }

  @Post("forgot-password/resend-otp")
  resendOtp(@Body() body: ForgetPassDto) {
    return this.clientService.resendOtp(body.email);
  }

  @ApiOperation({
    summary: "Sign in client",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "client sign in",
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
    @Body() signInDto: CreateClientDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.clientService.signIn(signInDto, res);
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
  newToken(@CookieGetter("clientToken") token: string) {
    return this.authService.newToken(this.clientService.getRepository, token);
  }

  @ApiOperation({
    summary: "Sign out client",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "client signed out successfully",
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
    @CookieGetter("clientToken") token: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.signOut(
      this.clientService.getRepository,
      token,
      res,
      "clientToken",
    );
  }

  @ApiOperation({
    summary: "Get all clients with pagination",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "All clients get successfully with pagination",
    schema: {
      example: {
        statusCode: 200,
        message: "success",
        data: [
          {
            ...clientData,
          },
        ],
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: "Error on get clients",
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
  @AccessRoles(Roles.SUPERADMIN, Roles.ADMIN, "ID")
  @Get()
  @ApiBearerAuth()
  findAllWithPagination(@Query() queryDto: QueryPaginationDto) {
    const { query, page, limit } = queryDto;
    const where = query ? { user_name: ILike(`%${query}%`) } : {};
    return this.clientService.findAllWithPagination({
      where,
      order: { createdAt: "DESC" },
      select: {
        id: true,
        user_name: true,
        email: true,
        phone_number: true,
        is_active: true,
        wallet: true,
      },
      skip: page,
      take: limit,
    });
  }

  @ApiOperation({
    summary: "Get all clients",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "All clients get successfully",
    schema: {
      example: {
        statusCode: 200,
        message: "success",
        data: [
          {
            ...clientData,
          },
        ],
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: "Error on get clients",
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
  @AccessRoles(Roles.SUPERADMIN, Roles.ADMIN)
  @Get("all")
  @ApiBearerAuth()
  findAll() {
    return this.clientService.findAll({
      where: { role: Roles.CLIENT },
      order: { createdAt: "DESC" },
      select: {
        id: true,
        user_name: true,
        is_active: true,
      },
    });
  }

  @ApiOperation({
    summary: "Get client by id",
  })
  @ApiParam({
    name: "id",
    type: "string",
    example: "e6b189ff-1d45-44e9-a252-5a0b48f3678f",
    description: "id of client",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "client get by id successfully",
    schema: {
      example: {
        statusCode: 200,
        message: "success",
        data: {
          ...clientData,
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: "Error on get client by id",
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
  @AccessRoles(Roles.SUPERADMIN, Roles.ADMIN, "ID")
  @Get(":id")
  @ApiBearerAuth()
  findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.clientService.findOneById(id, {
      where: { role: Roles.CLIENT },
      relations: ["payments", "orders", "penalties"],
    });
  }

  @ApiOperation({
    summary: "Update client by id",
  })
  @ApiParam({
    name: "id",
    type: "string",
    example: "e6b189ff-1d45-44e9-a252-5a0b48f3678f",
    description: "id of client",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "client updated by id successfully",
    schema: {
      example: {
        statusCode: 200,
        message: "success",
        data: {
          ...clientData,
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: "Error on updating client by id",
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
  @AccessRoles(Roles.SUPERADMIN, Roles.ADMIN, "ID")
  @Patch(":id")
  @ApiBearerAuth()
  update(
    @GetRequestUser("user") user: IToken,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() updateClientDto: UpdateClientDto,
  ) {
    return this.clientService.updateClient(id, updateClientDto, user);
  }

  @ApiOperation({
    summary: "Update wallet of lessor by id",
  })
  @ApiParam({
    name: "id",
    type: "string",
    example: "e6b189ff-1d45-44e9-a252-5a0b48f3678f",
    description: "id of lessor",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Wallet of lessor updated successfully",
    schema: {
      example: {
        statusCode: 200,
        message: "success",
        data: {
          ...clientData,
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: "Error on updating wallet of lessor by id",
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
  @AccessRoles(Roles.SUPERADMIN, Roles.ADMIN, "ID")
  @ApiBearerAuth()
  @Patch(":id/wallet")
  updateWallet(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() updateWalletDto: UpdateWalletDto,
  ) {
    return this.clientService.updateWallet(id, updateWalletDto);
  }

  @ApiOperation({
    summary: "Delete client by id",
  })
  @ApiParam({
    name: "id",
    type: "string",
    example: "e6b189ff-1d45-44e9-a252-5a0b48f3678f",
    description: "id of client",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "client deleted by id successfully",
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
    description: "Error on deleting client by id",
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
  @AccessRoles(Roles.SUPERADMIN, Roles.ADMIN)
  @Delete(":id")
  @ApiBearerAuth()
  remove(@Param("id", ParseUUIDPipe) id: string) {
    return this.clientService.delete(id);
  }
}
