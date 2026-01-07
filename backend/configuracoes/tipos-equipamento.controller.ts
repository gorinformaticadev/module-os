import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '@core/common/guards/jwt-auth.guard';
import { TiposEquipamentoService } from './tipos-equipamento.service';

@Controller('api/ordem_servico/tipos-equipamento')
@UseGuards(JwtAuthGuard)
export class TiposEquipamentoController {
  constructor(private readonly tiposEquipamentoService: TiposEquipamentoService) {}

  @Get()
  async findAll(@Request() req: any) {
    const tenantId = req.user?.tenantId || req.headers['x-tenant-id'];
    return this.tiposEquipamentoService.findAll(tenantId);
  }

  @Get(':id')
  async findOne(@Request() req: any, @Param('id') id: string) {
    const tenantId = req.user?.tenantId || req.headers['x-tenant-id'];
    return this.tiposEquipamentoService.findOne(tenantId, id);
  }

  @Post()
  async create(@Request() req: any, @Body() createDto: { nome: string }) {
    const tenantId = req.user?.tenantId || req.headers['x-tenant-id'];
    return this.tiposEquipamentoService.create(tenantId, createDto);
  }

  @Put(':id')
  async update(@Request() req: any, @Param('id') id: string, @Body() updateDto: { nome: string }) {
    const tenantId = req.user?.tenantId || req.headers['x-tenant-id'];
    return this.tiposEquipamentoService.update(tenantId, id, updateDto);
  }

  @Delete(':id')
  async remove(@Request() req: any, @Param('id') id: string) {
    const tenantId = req.user?.tenantId || req.headers['x-tenant-id'];
    return this.tiposEquipamentoService.remove(tenantId, id);
  }
}