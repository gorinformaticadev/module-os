import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '@core/common/guards/jwt-auth.guard';
import { TiposServicoService } from './tipos-servico.service';

@Controller('ordem_servico/tipos-servico')
@UseGuards(JwtAuthGuard)
export class TiposServicoController {
  constructor(private readonly tiposServicoService: TiposServicoService) {}

  @Get()
  async findAll(@Request() req: any) {
    const tenantId = req.user?.tenantId || req.headers['x-tenant-id'];
    return this.tiposServicoService.findAll(tenantId);
  }

  @Get(':id')
  async findOne(@Request() req: any, @Param('id') id: string) {
    const tenantId = req.user?.tenantId || req.headers['x-tenant-id'];
    return this.tiposServicoService.findOne(tenantId, id);
  }

  @Post()
  async create(@Request() req: any, @Body() createDto: { nome: string }) {
    const tenantId = req.user?.tenantId || req.headers['x-tenant-id'];
    return this.tiposServicoService.create(tenantId, createDto);
  }

  @Put(':id')
  async update(@Request() req: any, @Param('id') id: string, @Body() updateDto: { nome: string }) {
    const tenantId = req.user?.tenantId || req.headers['x-tenant-id'];
    return this.tiposServicoService.update(tenantId, id, updateDto);
  }

  @Delete(':id')
  async remove(@Request() req: any, @Param('id') id: string) {
    const tenantId = req.user?.tenantId || req.headers['x-tenant-id'];
    return this.tiposServicoService.remove(tenantId, id);
  }
}
