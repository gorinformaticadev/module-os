import { Controller, Get, Put, Post, Body, Param, UseGuards, Req, Logger } from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { JwtAuthGuard } from '@core/common/guards/jwt-auth.guard';
import { ConfiguracoesService } from './configuracoes.service';

@Controller('api/ordem_servico/config')
@UseGuards(JwtAuthGuard)
export class ConfiguracoesController {
    private readonly logger = new Logger(ConfiguracoesController.name);

    constructor(private readonly service: ConfiguracoesService) {
        const fs = require('fs');
        fs.appendFileSync('d:/github/Projeto-menu-multitenant-seguro/module_loading_debug.log', `[${new Date().toISOString()}] 🔩 ConfiguracoesController instanciado!\n`);
    }

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

    @Get('profile-permissions')
    async getProfilePermissions(@Req() req: ExpressRequest & { user: any }) {
        try {
            this.logger.log(`getProfilePermissions endpoint chamado. Tenant: ${req.user?.tenantId}`);
            return await this.service.getProfilePermissions(req.user.tenantId);
        } catch (error) {
            this.logger.error(`❌ Erro no endpoint getProfilePermissions:`, error);
            throw error;
        }
    }

    @Post('profile-permissions')
    async updateProfilePermissions(@Req() req: ExpressRequest & { user: any }, @Body() body: { permissions: any }) {
        try {
            this.logger.log(`updateProfilePermissions endpoint chamado. Tenant: ${req.user?.tenantId}`);
            return await this.service.updateProfilePermissions(req.user.tenantId, body.permissions);
        } catch (error) {
            this.logger.error(`❌ Erro no endpoint updateProfilePermissions:`, error);
            throw error;
        }
    }

    @Get('notifications')
    async getNotifications(@Req() req: ExpressRequest & { user: any }) {
        try {
            this.logger.log(`getNotifications endpoint chamado. Tenant: ${req.user?.tenantId}`);
            return await this.service.getNotifications(req.user.tenantId);
        } catch (error) {
            this.logger.error(`❌ Erro no endpoint getNotifications:`, error);
            throw error;
        }
    }

    @Post('notifications')
    async createNotification(@Req() req: ExpressRequest & { user: any }, @Body() body: any) {
        try {
            this.logger.log(`createNotification endpoint chamado. Tenant: ${req.user?.tenantId}`);
            return await this.service.createNotification(req.user.tenantId, body);
        } catch (error) {
            this.logger.error(`❌ Erro no endpoint createNotification:`, error);
            throw error;
        }
    }

    @Get('ai')
    async getAiConfig(@Req() req: ExpressRequest & { user: any }) {
        try {
            this.logger.log(`getAiConfig endpoint chamado. Tenant: ${req.user?.tenantId}`);
            return await this.service.getAiConfig(req.user.tenantId);
        } catch (error) {
            this.logger.error(`❌ Erro no endpoint getAiConfig:`, error);
            throw error;
        }
    }

    @Post('ai')
    async updateAiConfig(@Req() req: ExpressRequest & { user: any }, @Body() body: any) {
        try {
            this.logger.log(`updateAiConfig endpoint chamado. Tenant: ${req.user?.tenantId}`);
            return await this.service.updateAiConfig(req.user.tenantId, body);
        } catch (error) {
            this.logger.error(`❌ Erro no endpoint updateAiConfig:`, error);
            throw error;
        }
    }

    @Post('ai/test')
    async testAiConfig(@Req() req: ExpressRequest & { user: any }, @Body() body: any) {
        try {
            this.logger.log(`testAiConfig endpoint chamado. Tenant: ${req.user?.tenantId}`);
            return await this.service.testAiConfig(req.user.tenantId, body);
        } catch (error) {
            this.logger.error(`❌ Erro no endpoint testAiConfig:`, error);
            throw error;
        }
    }
}