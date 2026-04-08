import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '@core/common/guards/jwt-auth.guard';
import { TiposEquipamentoService } from './tipos-equipamento.service';
import { PermissionGuard } from '../shared/guards/permission.guard';
import { RequireConfigPermission } from '../shared/decorators/require-permission.decorator';
import { Permissions } from '../shared/decorators/permissions.decorator';

@Controller('ordem_servico/tipos-equipamento')
@Permissions('ordem_servico.config')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class TiposEquipamentoController {
  constructor(private readonly tiposEquipamentoService: TiposEquipamentoService) {}

  @Get()
  @RequireConfigPermission('view')
  async findAll(@Request() req: any) {
    const tenantId = req.user?.tenantId;
    return this.tiposEquipamentoService.findAll(tenantId);
  }

  @Get(':id')
  @RequireConfigPermission('view')
  async findOne(@Request() req: any, @Param('id') id: string) {
    const tenantId = req.user?.tenantId;
    return this.tiposEquipamentoService.findOne(tenantId, id);
  }

  @Post()
  @RequireConfigPermission('edit')
  async create(@Request() req: any, @Body() createDto: { nome: string }) {
    const tenantId = req.user?.tenantId;
    return this.tiposEquipamentoService.create(tenantId, createDto);
  }

  @Put(':id')
  @RequireConfigPermission('edit')
  async update(@Request() req: any, @Param('id') id: string, @Body() updateDto: { nome: string }) {
    const tenantId = req.user?.tenantId;
    return this.tiposEquipamentoService.update(tenantId, id, updateDto);
  }

  @Delete(':id')
  @RequireConfigPermission('edit')
  async remove(@Request() req: any, @Param('id') id: string) {
    const tenantId = req.user?.tenantId;
    return this.tiposEquipamentoService.remove(tenantId, id);
  }
}
