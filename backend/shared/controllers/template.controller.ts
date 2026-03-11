import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Req, Logger } from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { JwtAuthGuard } from '@core/common/guards/jwt-auth.guard';
import { TemplateService } from '../services/template.service';
import { PermissionGuard } from '../guards/permission.guard';
import { RequireConfigPermission } from '../decorators/require-permission.decorator';

@Controller('ordem_servico/templates')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class TemplateController {
    private readonly logger = new Logger(TemplateController.name);

    constructor(private readonly templateService: TemplateService) {}

    @Get()
    @RequireConfigPermission('view')
    async findAll(@Req() req: ExpressRequest & { user: any }) {
        try {
            this.logger.log(`Buscando templates. Tenant: ${req.user?.tenantId}`);
            return await this.templateService.findAll(req.user.tenantId);
        } catch (error) {
            this.logger.error('❌ Erro ao buscar templates:', error);
            throw error;
        }
    }

    @Get(':id')
    @RequireConfigPermission('view')
    async findById(
        @Req() req: ExpressRequest & { user: any },
        @Param('id') id: string
    ) {
        try {
            this.logger.log(`Buscando template ${id}. Tenant: ${req.user?.tenantId}`);
            return await this.templateService.findById(req.user.tenantId, id);
        } catch (error) {
            this.logger.error(`❌ Erro ao buscar template ${id}:`, error);
            throw error;
        }
    }

    @Post()
    @RequireConfigPermission('manage_permissions')
    async create(
        @Req() req: ExpressRequest & { user: any },
        @Body() data: any
    ) {
        try {
            this.logger.log(`Criando template. Tenant: ${req.user?.tenantId}`);
            return await this.templateService.create(req.user.tenantId, data, req.user.id);
        } catch (error) {
            this.logger.error('❌ Erro ao criar template:', error);
            throw error;
        }
    }

    @Put(':id')
    @RequireConfigPermission('manage_permissions')
    async update(
        @Req() req: ExpressRequest & { user: any },
        @Param('id') id: string,
        @Body() data: any
    ) {
        try {
            this.logger.log(`Atualizando template ${id}. Tenant: ${req.user?.tenantId}`);
            return await this.templateService.update(req.user.tenantId, id, data, req.user.id);
        } catch (error) {
            this.logger.error(`❌ Erro ao atualizar template ${id}:`, error);
            throw error;
        }
    }

    @Delete(':id')
    @RequireConfigPermission('manage_permissions')
    async delete(
        @Req() req: ExpressRequest & { user: any },
        @Param('id') id: string
    ) {
        try {
            this.logger.log(`Excluindo template ${id}. Tenant: ${req.user?.tenantId}`);
            return await this.templateService.delete(req.user.tenantId, id, req.user.id);
        } catch (error) {
            this.logger.error(`❌ Erro ao excluir template ${id}:`, error);
            throw error;
        }
    }
}
