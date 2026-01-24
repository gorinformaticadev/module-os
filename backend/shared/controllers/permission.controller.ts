import { Controller, Get, Post, Put, Body, Param, UseGuards, Req, Logger } from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { JwtAuthGuard } from '@core/common/guards/jwt-auth.guard';
import { PermissionService } from '../services/permission.service';

@Controller('api/ordem_servico/permissions')
@UseGuards(JwtAuthGuard)
export class PermissionController {
    private readonly logger = new Logger(PermissionController.name);

    constructor(private readonly permissionService: PermissionService) {}

    @Get('available')
    async getAvailablePermissions() {
        try {
            this.logger.log('Buscando permissões disponíveis');
            return this.permissionService.getAvailablePermissions();
        } catch (error) {
            this.logger.error('❌ Erro ao buscar permissões disponíveis:', error);
            throw error;
        }
    }

    @Get('users')
    async getUsersWithPermissions(@Req() req: ExpressRequest & { user: any }) {
        try {
            this.logger.log(`Buscando usuários com permissões. Tenant: ${req.user?.tenantId}`);
            return await this.permissionService.getUsersWithPermissions(req.user.tenantId);
        } catch (error) {
            this.logger.error('❌ Erro ao buscar usuários com permissões:', error);
            throw error;
        }
    }

    @Get('users/:userId')
    async getUserPermissions(
        @Req() req: ExpressRequest & { user: any },
        @Param('userId') userId: string
    ) {
        try {
            this.logger.log(`Buscando permissões do usuário ${userId}. Tenant: ${req.user?.tenantId}`);
            return await this.permissionService.getUserPermissions(req.user.tenantId, userId);
        } catch (error) {
            this.logger.error(`❌ Erro ao buscar permissões do usuário ${userId}:`, error);
            throw error;
        }
    }

    @Put('users/:userId')
    async updateUserPermissions(
        @Req() req: ExpressRequest & { user: any },
        @Param('userId') userId: string,
        @Body() body: { permissions: any[] }
    ) {
        try {
            this.logger.log(`Atualizando permissões do usuário ${userId}. Tenant: ${req.user?.tenantId}`);
            await this.permissionService.updateUserPermissions(
                req.user.tenantId,
                userId,
                body.permissions,
                req.user.id
            );
            return { success: true };
        } catch (error) {
            this.logger.error(`❌ Erro ao atualizar permissões do usuário ${userId}:`, error);
            throw error;
        }
    }

    @Get('audit')
    async getPermissionAudit(
        @Req() req: ExpressRequest & { user: any },
        @Param('userId') userId?: string
    ) {
        try {
            this.logger.log(`Buscando auditoria de permissões. Tenant: ${req.user?.tenantId}`);
            return await this.permissionService.getPermissionAudit(req.user.tenantId, userId);
        } catch (error) {
            this.logger.error('❌ Erro ao buscar auditoria de permissões:', error);
            throw error;
        }
    }

    @Get('config/profile-permissions')
    async getProfilePermissions(@Req() req: ExpressRequest & { user: any }) {
        try {
            this.logger.log(`Buscando permissões de perfil. Tenant: ${req.user?.tenantId}`);
            return await this.permissionService.getProfilePermissions(req.user.tenantId);
        } catch (error) {
            this.logger.error('❌ Erro ao buscar permissões de perfil:', error);
            throw error;
        }
    }

    @Post('config/profile-permissions')
    async updateProfilePermissions(
        @Req() req: ExpressRequest & { user: any },
        @Body() body: { permissions: Record<string, { admin: boolean; technician: boolean; attendant: boolean }> }
    ) {
        try {
            this.logger.log(`Atualizando permissões de perfil. Tenant: ${req.user?.tenantId}`);
            await this.permissionService.updateProfilePermissions(
                req.user.tenantId,
                body.permissions,
                req.user.id
            );
            return { success: true };
        } catch (error) {
            this.logger.error('❌ Erro ao atualizar permissões de perfil:', error);
            throw error;
        }
    }
}