import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Req, Logger } from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { JwtAuthGuard } from '@core/common/guards/jwt-auth.guard';
import { TemplateService } from '../services/template.service';

@Controller('api/ordem_servico/templates')
@UseGuards(JwtAuthGuard)
export class TemplateController {
    private readonly logger = new Logger(TemplateController.name);

    constructor(private readonly templateService: TemplateService) {}

    @Get()
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