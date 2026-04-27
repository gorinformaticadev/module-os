import { PermissionGuard } from '../../shared/guards/permission.guard';
import { ModulePermissions } from '../../shared/decorators/module-permissions.decorator';
import { Action } from '../../shared/decorators/action.decorator';
import { Public } from '../../shared/decorators/public.decorator';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "@core/common/guards/jwt-auth.guard";
import { TiposEquipamentoService } from "./tipos-equipamento.service";
import { RequireConfigPermission } from "../shared/decorators/require-permission.decorator";

@Controller("ordem_servico/tipos-equipamento")
@ModulePermissions("ordem_servico.config")
@UseGuards(JwtAuthGuard, PermissionGuard)
export class TiposEquipamentoController {
  constructor(
    private readonly tiposEquipamentoService: TiposEquipamentoService,
  ) {}

  @Get()
  @RequireConfigPermission("view")
  async findAll() {
    return this.tiposEquipamentoService.findAll();
  }

  @Get(":id")
  @RequireConfigPermission("view")
  async findOne(@Param("id") id: string) {
    return this.tiposEquipamentoService.findOne(id);
  }

  @Post()
  @RequireConfigPermission("edit")
  async create(@Body() createDto: { nome: string }) {
    return this.tiposEquipamentoService.create(createDto);
  }

  @Put(":id")
  @RequireConfigPermission("edit")
  async update(@Param("id") id: string, @Body() updateDto: { nome: string }) {
    return this.tiposEquipamentoService.update(id, updateDto);
  }

  @Delete(":id")
  @RequireConfigPermission("edit")
  async remove(@Param("id") id: string) {
    return this.tiposEquipamentoService.remove(id);
  }
}
