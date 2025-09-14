import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import { OrderQueryDto } from "src/common/dto/order-query.dto";
import { QueryPaginationDto } from "src/common/dto/query-pagination.dto";
import { ILike } from "typeorm";
import { CreateOrderDto, ExtendOrderDto } from "./dto/create-order.dto";
import { UpdateOrderDto } from "./dto/update-order.dto";
import { OrderService } from "./order.service";

@Controller("orders")
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  // @UseGuards(AuthGuard, RolesGuard)
  // @AccessRoles(Roles.SUPERADMIN, Roles.ADMIN, Roles.LESSOR, Roles.CLIENT, 'ID')
  // @ApiBearerAuth()
  @Post()
  create(@Body() createOrderDto: CreateOrderDto) {
    return this.orderService.create(createOrderDto);
  }

  // @UseGuards(AuthGuard, RolesGuard)
  // @AccessRoles(Roles.SUPERADMIN, Roles.ADMIN, Roles.LESSOR, Roles.CLIENT, 'ID')
  // @ApiBearerAuth()
  @Get("find-all")
  async findAll() {
    return this.orderService.findAll({
      relations: ["client_id", "item_id", "payment_id", "penalty"],
    });
  }

  // @UseGuards(AuthGuard, RolesGuard)
  // @AccessRoles(Roles.SUPERADMIN, Roles.ADMIN, Roles.LESSOR, Roles.CLIENT, 'ID')
  // @ApiBearerAuth()
  @Get()
  async findAllWithPagination(@Query() queryDto: OrderQueryDto) {
    const { page, limit, client_number, lessor_number } = queryDto;
    const where = client_number
      ? { client_id: { phone_number: ILike(`%${client_number}%`) } }
      : lessor_number
        ? { lessor_id: { phone_number: ILike(`%${lessor_number}%`) } }
        : {};

    return this.orderService.findAllWithPagination({
      where,
      order: { createdAt: "DESC" },
      relations: ["client_id", "item_id", "payment_id", "penalty"],
      skip: page,
      take: limit,
    });
  }

  // @UseGuards(AuthGuard, RolesGuard)
  // @AccessRoles(Roles.SUPERADMIN, Roles.ADMIN, Roles.LESSOR, Roles.CLIENT, 'ID')
  // @ApiBearerAuth()
  @Get("client/:id")
  async findAllOrdersForClient(
    @Query() queryDto: QueryPaginationDto,
    @Param("id") id: string,
  ) {
    const { page, limit, query } = queryDto;

    const where = query
      ? { client_id: { id }, item_id: { name: ILike(`%${query}%`) } }
      : { client_id: { id } };

    return this.orderService.findAllWithPagination({
      where,
      order: { createdAt: "DESC" },
      relations: ["client_id", "item_id", "payment_id", "penalty"],
      skip: page,
      take: limit,
    });
  }

  // @UseGuards(AuthGuard, RolesGuard)
  // @AccessRoles(Roles.SUPERADMIN, Roles.ADMIN, Roles.LESSOR, Roles.CLIENT, 'ID')
  // @ApiBearerAuth()
  @Get(":id")
  async findOne(@Param("id") id: string) {
    const checkOrder = await this.orderService.findOneById(id);
    if (!checkOrder) throw new NotFoundException(`Not found order`);

    return this.orderService.findOneById(id, {
      relations: ["client_id", "item_id", "payment_id", "penalty"],
    });
  }

  // @UseGuards(AuthGuard, RolesGuard)
  // @AccessRoles(Roles.SUPERADMIN, Roles.ADMIN, Roles.LESSOR, Roles.CLIENT, 'ID')
  // @ApiBearerAuth()
  @Patch(":id")
  async update(
    @Param("id") id: string,
    @Body() updateOrderDto: UpdateOrderDto,
  ) {
    return this.orderService.update(id, updateOrderDto);
  }

  // @UseGuards(AuthGuard, RolesGuard)
  // @AccessRoles(Roles.SUPERADMIN, Roles.ADMIN, Roles.LESSOR, Roles.CLIENT, 'ID')
  // @ApiBearerAuth()
  @Delete(":id")
  async remove(@Param("id") id: string) {
    return this.orderService.remove(id);
  }

  // @UseGuards(AuthGuard, RolesGuard)
  // @AccessRoles(Roles.SUPERADMIN, Roles.ADMIN, Roles.LESSOR, Roles.CLIENT, 'ID')
  // @ApiBearerAuth()
  @Patch(":id/cancel")
  cancelOrder(@Param("id") id: string) {
    return this.orderService.cancelOrder(id);
  }

  // @UseGuards(AuthGuard, RolesGuard)
  // @AccessRoles(Roles.SUPERADMIN, Roles.ADMIN, Roles.LESSOR, Roles.CLIENT, 'ID')
  // @ApiBearerAuth()
  @Get("status/active")
  getActiveOrders() {
    return this.orderService.getActiveOrders();
  }

  // @UseGuards(AuthGuard, RolesGuard)
  // @AccessRoles(Roles.SUPERADMIN, Roles.ADMIN, Roles.LESSOR, Roles.CLIENT, 'ID')
  // @ApiBearerAuth()
  @Patch(":id/extend")
  extendOrderDate(@Param("id") id: string, @Body() extraDays: ExtendOrderDto) {
    return this.orderService.extendOrderDate(id, extraDays.extraDays);
  }

  // @UseGuards(AuthGuard, RolesGuard)
  // @AccessRoles(Roles.SUPERADMIN, Roles.ADMIN, Roles.LESSOR, Roles.CLIENT, 'ID')
  // @ApiBearerAuth()
  @Get("stats/top-items")
  getTopItems() {
    return this.orderService.getTopItems();
  }

  // @UseGuards(AuthGuard, RolesGuard)
  // @AccessRoles(Roles.SUPERADMIN, Roles.ADMIN, Roles.LESSOR, Roles.CLIENT, 'ID')
  // @ApiBearerAuth()
  @Get("stats/profitable-items")
  getMostProfitableItems() {
    return this.orderService.getMostProfitableItems();
  }
}
