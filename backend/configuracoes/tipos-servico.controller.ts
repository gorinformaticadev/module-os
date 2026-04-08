import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '@core/common/guards/jwt-auth.guard';
import { TiposServicoService } from './tipos-servico.service';
import { PermissionGuard } from '../shared/guards/permission.guard';
import { RequireConfigPermission } from '../shared/decorators/require-permission.decorator';
import { Permissions } from '../shared/decorators/permissions.decorator';

@Controller('ordem_servico/tipos-servico')
@Permissions('ordem_servico.config')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class TiposServicoController {
  constructor(private readonly tiposServicoService: TiposServicoService) {}

  @Get()
  @RequireConfigPermission('view')
  async findAll(@Request() req: any) {
    const tenantId = req.user?.tenantId;
    return this.tiposServicoService.findAll(tenantId);
  }

  @Get(':id')
  @RequireConfigPermission('view')
  async findOne(@Request() req: any, @Param('id') id: string) {
    const tenantId = req.user?.tenantId;
    return this.tiposServicoService.findOne(tenantId, id);
  }

  @Post()
  @RequireConfigPermission('edit')
  async create(@Request() req: any, @Body() createDto: { nome: string }) {
    const tenantId = req.user?.tenantId;
    return this.tiposServicoService.create(tenantId, createDto);
  }

  @Put(':id')
  @RequireConfigPermission('edit')
  async update(@Request() req: any, @Param('id') id: string, @Body() updateDto: { nome: string }) {
    const tenantId = req.user?.tenantId;
    return this.tiposServicoService.update(tenantId, id, updateDto);
  }

  @Delete(':id')
  @RequireConfigPermission('edit')
  async remove(@Request() req: any, @Param('id') id: string) {
    const tenantId = req.user?.tenantId;
    return this.tiposServicoService.remove(tenantId, id);
  }
}
