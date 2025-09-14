import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from "@nestjs/common";
import { ItemService } from "./item.service";
import { CreateItemDto } from "./dto/create-item.dto";
import { UpdateItemDto } from "./dto/update-item.dto";
import { RolesGuard } from "src/common/guard/role.guard";
import { AuthGuard } from "src/common/guard/auth.guard";
import { Roles } from "src/common/enum";
import { AccessRoles } from "src/common/decorator/roles.decorator";
import { ApiBearerAuth } from "@nestjs/swagger";

@Controller("item")
export class ItemController {
  constructor(private readonly itemService: ItemService) {}
  @UseGuards(AuthGuard, RolesGuard)
  @AccessRoles(Roles.SUPERADMIN, Roles.ADMIN, Roles.LESSOR, "ID")
  @ApiBearerAuth()
  @Post()
  create(@Body() createItemDto: CreateItemDto) {
    return this.itemService.createItem(createItemDto);
  }

  @Get()
  findAll() {
    return this.itemService.findAll({
      relations: ["orders", "images", "category_id", "lessor_id"],
    });
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.itemService.findOneById(id, {
      relations: ["orders", "images", "category_id", "lessor_id"],
    });
  }

  @UseGuards(AuthGuard, RolesGuard)
  @AccessRoles(Roles.SUPERADMIN, Roles.ADMIN, Roles.LESSOR, "ID")
  @ApiBearerAuth()
  @Patch(":id")
  update(@Param("id") id: string, @Body() updateItemDto: UpdateItemDto) {
    return this.itemService.update(id, updateItemDto);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @AccessRoles(Roles.SUPERADMIN, Roles.ADMIN, Roles.LESSOR, "ID")
  @ApiBearerAuth()
  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.itemService.delete(id);
  }
}
