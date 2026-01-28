import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { NotificationRuleService } from './rules.service';
import { NotificationHistoryService } from './history.service';
import { JwtAuthGuard } from '../../../core/guards/jwt-auth.guard';

@Controller('api/ordem_servico/notificacoes')
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
        return this.rules.create(req.user.tenantId, data);
    }

    @Put('regras/:id')
    async updateRule(@Req() req: any, @Param('id') id: string, @Body() data: any) {
        return this.rules.update(req.user.tenantId, id, data);
    }

    @Delete('regras/:id')
    async removeRule(@Req() req: any, @Param('id') id: string) {
        return this.rules.remove(req.user.tenantId, id);
    }

    @Get('historico')
    async findAllHistory(@Req() req: any, @Query() filters: any) {
        return this.history.findAll(req.user.tenantId, filters);
    }
}
