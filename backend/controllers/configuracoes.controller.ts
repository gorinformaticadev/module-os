import { Controller, Get, Put, Body, Param, UseGuards, Req, Logger } from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { JwtAuthGuard } from '@core/guards/jwt-auth.guard';
import { OrdemServicoConfiguracoesService } from '../services/configuracoes.service';

@Controller('modules/ordem_servico/config')
@UseGuards(JwtAuthGuard)
export class OrdemServicoConfiguracoesController {
    private readonly logger = new Logger(OrdemServicoConfiguracoesController.name);

    constructor(private readonly service: OrdemServicoConfiguracoesService) { }

    @Get('users')
    async getUsers(@Req() req: ExpressRequest & { user: any }) {
        try {
            this.logger.log(`getUsers endpoint chamado. Tenant: ${req.user?.tenantId}`);
            return await this.service.getUsers(req.user.tenantId);
        } catch (error) {
            this.logger.error(`❌ Erro no endpoint getUsers:`, error);
            throw error;
        }
    }

    @Put('users/:id/technician')
    async toggleTechnician(@Req() req: ExpressRequest & { user: any }, @Param('id') id: string, @Body() body: { is_technician: boolean }) {
        try {
            this.logger.log(`toggleTechnician endpoint chamado. User: ${id}, isTechnician: ${body.is_technician}`);
            return await this.service.toggleTechnician(req.user.tenantId, id, body.is_technician);
        } catch (error) {
            this.logger.error(`❌ Erro no endpoint toggleTechnician:`, error);
            throw error;
        }
    }
}