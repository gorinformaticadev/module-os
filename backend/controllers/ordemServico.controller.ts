import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards, Req } from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { OrdemServicoService } from '../services/ordemServico.service';
import { JwtAuthGuard } from '@core/guards/jwt-auth.guard';
import { RolesGuard } from '@core/guards/roles.guard';
import { Roles } from '@core/decorators/roles.decorator';

@Controller('api/ordem_servico')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrdemServicoController {
    constructor(private readonly service: OrdemServicoService) { }

    @Get()
    async findAll(@Query() filters: any, @Req() req: ExpressRequest & { user: any }) {
        const tenantId = req.user?.tenantId;
        return this.service.findAll(tenantId, filters);
    }

    @Get('stats')
    async getStats(@Req() req: ExpressRequest & { user: any }) {
        const tenantId = req.user?.tenantId;
        return this.service.getStats(tenantId);
    }
}
