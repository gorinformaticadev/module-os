
import { Controller, Get, Put, Body, Param, UseGuards, Req } from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { JwtAuthGuard } from '@core/guards/jwt-auth.guard';
import { OrdemServicoConfiguracoesService } from '../services/configuracoes.service';

@Controller('modules/ordem_servico/config')
@UseGuards(JwtAuthGuard)
export class OrdemServicoConfiguracoesController {
    constructor(private readonly service: OrdemServicoConfiguracoesService) { }

    @Get('users')
    async getUsers(@Req() req: ExpressRequest & { user: any }) {
        return this.service.getUsers(req.user.tenantId);
    }

    @Put('users/:id/technician')
    async toggleTechnician(@Req() req: ExpressRequest & { user: any }, @Param('id') id: string, @Body() body: { is_technician: boolean }) {
        return this.service.toggleTechnician(req.user.tenantId, id, body.is_technician);
    }
}
