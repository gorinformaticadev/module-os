import { Controller, Get, Post, Put, Patch, Delete, Body, Param, Query, UseGuards, Req, HttpCode, HttpStatus } from '@nestjs/common';
import { NotificationRuleService } from './rules.service';
import { NotificationHistoryService } from './history.service';
import { JwtAuthGuard } from '../../../core/guards/jwt-auth.guard';
import { validateCreatePayload, validateUpdatePayload, handlePrismaError } from './dto/rule.dto';

@Controller('ordem_servico/notificacoes')
@UseGuards(JwtAuthGuard)
export class NotificationRuleController {
    constructor(
        private readonly rules: NotificationRuleService,
        private readonly history: NotificationHistoryService
    ) { }

    @Get('regras')
    async findAllRules(@Req() req: any) {
        return this.rules.findAll(req.user.tenantId);
    }

    @Get('regras/:id')
    async findOneRule(@Req() req: any, @Param('id') id: string) {
        return this.rules.findOne(req.user.tenantId, id);
    }

    @Post('regras')
    async createRule(@Req() req: any, @Body() data: any) {
        try {
            // Validação explícita do payload
            const validatedData = validateCreatePayload(data);
            return this.rules.create(req.user.tenantId, validatedData);
        } catch (error: any) {
            // Re-lançar erros de validação e BadRequest
            if (error.status) throw error;
            handlePrismaError(error, 'criação de regra');
        }
    }

    @Put('regras/:id')
    async updateRule(@Req() req: any, @Param('id') id: string, @Body() data: any) {
        try {
            // Buscar regra existente para contexto (necessário para validação correta de trigger_config)
            const existingRule = await this.rules.findOne(req.user.tenantId, id);

            // Validação explícita do payload, passando o trigger_type existente como fallback
            const validatedData = validateUpdatePayload({
                ...data,
                trigger_type: data.trigger_type || existingRule.trigger_type
            });

            return this.rules.update(req.user.tenantId, id, validatedData);
        } catch (error: any) {
            if (error.status) throw error;
            handlePrismaError(error, 'atualização de regra');
        }
    }

    @Patch('regras/:id')
    async patchRule(@Req() req: any, @Param('id') id: string, @Body() data: any) {
        // Atualização parcial - usa a mesma validação do PUT
        try {
            const validatedData = validateUpdatePayload(data);
            return this.rules.update(req.user.tenantId, id, validatedData);
        } catch (error: any) {
            if (error.status) throw error;
            handlePrismaError(error, 'atualização parcial de regra');
        }
    }

    @Patch('regras/:id/toggle')
    async toggleRule(@Req() req: any, @Param('id') id: string, @Body() data: any) {
        // Endpoint específico para toggle de status (atualização parcial mínima)
        try {
            if (data.enabled === undefined) {
                throw { status: 400, message: 'Campo enabled é obrigatório para toggle' };
            }
            return this.rules.update(req.user.tenantId, id, { enabled: Boolean(data.enabled) });
        } catch (error: any) {
            if (error.status) throw error;
            handlePrismaError(error, 'toggle de regra');
        }
    }

    @Delete('regras/:id')
    async removeRule(@Req() req: any, @Param('id') id: string) {
        try {
            return this.rules.remove(req.user.tenantId, id);
        } catch (error: any) {
            if (error.status) throw error;
            handlePrismaError(error, 'exclusão de regra');
        }
    }

    @Get('historico')
    async findAllHistory(@Req() req: any, @Query() filters: any) {
        return this.history.findAll(req.user.tenantId, filters);
    }
}
