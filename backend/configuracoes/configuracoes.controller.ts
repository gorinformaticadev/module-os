import { Controller, Get, Put, Post, Body, Param, UseGuards, Req, Logger } from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { JwtAuthGuard } from '@core/common/guards/jwt-auth.guard';
import { PermissionGuard } from '../shared/guards/permission.guard';
import { RequireConfigPermission } from '../shared/decorators/require-permission.decorator';

import { ConfiguracoesService } from './configuracoes.service';

@Controller('ordem_servico/config')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class ConfiguracoesController {
    private readonly logger = new Logger(ConfiguracoesController.name);

    constructor(private readonly service: ConfiguracoesService) {
    }

    @Get('users')
    @RequireConfigPermission('manage_permissions')
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
    @RequireConfigPermission('manage_permissions')
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
    @RequireConfigPermission('manage_permissions')
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
    @RequireConfigPermission('manage_permissions')
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
    @RequireConfigPermission('manage_notifications')
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
    @RequireConfigPermission('manage_notifications')
    async createNotification(@Req() req: ExpressRequest & { user: any }, @Body() body: any) {
        try {
            this.logger.log(`createNotification endpoint chamado. Tenant: ${req.user?.tenantId}`);
            return await this.service.createNotification(req.user.tenantId, body);
        } catch (error) {
            this.logger.error(`❌ Erro no endpoint createNotification:`, error);
            throw error;
        }
    }

    @Get(['ai', 'ia'])
    @RequireConfigPermission('view')
    async getAiConfig(@Req() req: ExpressRequest & { user: any }) {
        try {
            this.logger.log(`getAiConfig endpoint chamado. Tenant: ${req.user?.tenantId}`);
            return await this.service.getAiConfig(req.user.tenantId);
        } catch (error) {
            this.logger.error(`❌ Erro no endpoint getAiConfig:`, error);
            throw error;
        }
    }

    @Post(['ai', 'ia'])
    @RequireConfigPermission('edit')
    async updateAiConfig(@Req() req: ExpressRequest & { user: any }, @Body() body: any) {
        try {
            this.logger.log(`updateAiConfig endpoint chamado. Tenant: ${req.user?.tenantId}`);
            return await this.service.updateAiConfig(req.user.tenantId, body);
        } catch (error) {
            this.logger.error(`❌ Erro no endpoint updateAiConfig:`, error);
            throw error;
        }
    }

    @Post(['ai/test', 'ia/test'])
    @RequireConfigPermission('edit')
    async testAiConfig(@Req() req: ExpressRequest & { user: any }, @Body() body: any) {
        try {
            this.logger.log(`testAiConfig endpoint chamado. Tenant: ${req.user?.tenantId}`);
            return await this.service.testAiConfig(req.user.tenantId, body);
        } catch (error) {
            this.logger.error(`❌ Erro no endpoint testAiConfig:`, error);
            throw error;
        }
    }

    // ==================== CONFIGURAÇÕES GENÉRICAS ====================

    @Get('settings')
    @RequireConfigPermission('view')
    async getConfigurations(@Req() req: ExpressRequest & { user: any }) {
        try {
            this.logger.log(`getConfigurations endpoint chamado. Tenant: ${req.user?.tenantId}`);
            return await this.service.getConfigurations(req.user.tenantId);
        } catch (error) {
            this.logger.error(`❌ Erro no endpoint getConfigurations:`, error);
            throw error;
        }
    }

    @Post('settings')
    @RequireConfigPermission('edit')
    async saveConfiguration(@Req() req: ExpressRequest & { user: any }, @Body() body: { config_key: string, config_value: any }) {
        try {
            this.logger.log(`saveConfiguration endpoint chamado. Tenant: ${req.user?.tenantId}, Key: ${body.config_key}`);
            return await this.service.saveConfiguration(req.user.tenantId, body.config_key, body.config_value);
        } catch (error) {
            this.logger.error(`❌ Erro no endpoint saveConfiguration:`, error);
            throw error;
        }
    }
}
