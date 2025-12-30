import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards, Req } from '@nestjs/common';
import { moduloOsService } from '../services/moduloOs.service';
import { JwtAuthGuard } from '@core/guards/jwt-auth.guard';
import { RolesGuard } from '@core/guards/roles.guard';
import { Roles } from '@core/decorators/roles.decorator';

@Controller('api/moduloOs')
@UseGuards(JwtAuthGuard, RolesGuard)
export class moduloOsController {
  constructor(private readonly moduloOsService: moduloOsService) { }

  @Get()
  async findAll(@Query() filters: any, @Req() req) {
    const tenantId = req.user?.tenantId;
    return this.moduloOsService.findAll(tenantId, filters);
  }

  @Get('stats')
  async getStats(@Req() req) {
    const tenantId = req.user?.tenantId;
    return this.moduloOsService.getStats(tenantId);
  }
}
