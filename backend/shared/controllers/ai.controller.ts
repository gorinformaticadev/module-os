import { Body, Controller, Logger, Post, Req, UseGuards } from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { JwtAuthGuard } from '@core/common/guards/jwt-auth.guard';
import { AiService } from '../services/ai.service';
import { AI_PROMPTS } from '../services/prompts';
import { PermissionGuard } from '../guards/permission.guard';
import { RequireOrdersPermission } from '../decorators/require-permission.decorator';
import { Permissions } from '../decorators/permissions.decorator';

@Controller('ordem_servico/ai')
@Permissions('ordem_servico.ai')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class AiController {
    private readonly logger = new Logger(AiController.name);

    constructor(private readonly aiService: AiService) { }

    @Post('analisar-descricao')
    @RequireOrdersPermission('edit')
    async analisarDescricao(@Req() req: ExpressRequest & { user: any }, @Body() body: { descricao: string }) {
        try {
            this.logger.log(`Solicitacao de analise de descricao para tenant ${req.user.tenantId}`);

            const prompt = AI_PROMPTS.ANALISAR_DESCRICAO.user(body.descricao);
            const system = AI_PROMPTS.ANALISAR_DESCRICAO.system;
            const result = await this.aiService.callAI({ prompt, system });

            try {
                return JSON.parse(result);
            } catch {
                return { text: result };
            }
        } catch (error) {
            this.logger.error('Erro ao analisar descricao:', error);
            throw error;
        }
    }

    @Post('gerar-laudo')
    @RequireOrdersPermission('edit')
    async gerarLaudo(@Req() req: ExpressRequest & { user: any }, @Body() body: { problema: string, notas: string }) {
        try {
            this.logger.log(`Solicitacao de geracao de laudo para tenant ${req.user.tenantId}`);

            const prompt = AI_PROMPTS.GERAR_LAUDO.user(body.problema, body.notas);
            const system = AI_PROMPTS.GERAR_LAUDO.system;
            const result = await this.aiService.callAI({ prompt, system });

            return { laudo: result };
        } catch (error) {
            this.logger.error('Erro ao gerar laudo:', error);
            throw error;
        }
    }
}
