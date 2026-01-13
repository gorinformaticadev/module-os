import { Controller, Post, Body, UseGuards, Req, Logger } from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { JwtAuthGuard } from '@core/common/guards/jwt-auth.guard';
import { AiService } from '../services/ai.service';
import { AI_PROMPTS } from '../services/prompts';

@Controller('api/ordem_servico/ai')
@UseGuards(JwtAuthGuard)
export class AiController {
    private readonly logger = new Logger(AiController.name);

    constructor(private readonly aiService: AiService) { }

    @Post('analisar-descricao')
    async analisarDescricao(@Req() req: ExpressRequest & { user: any }, @Body() body: { descricao: string }) {
        try {
            this.logger.log(`Solicitação de análise de descrição para tenant ${req.user.tenantId}`);

            const prompt = AI_PROMPTS.ANALISAR_DESCRICAO.user(body.descricao);
            const system = AI_PROMPTS.ANALISAR_DESCRICAO.system;

            const result = await this.aiService.callAI(req.user.tenantId, { prompt, system });

            // Tentar fazer o parse do JSON se a resposta for um JSON string
            try {
                return JSON.parse(result);
            } catch {
                return { text: result };
            }
        } catch (error) {
            this.logger.error(`Erro ao analisar descrição:`, error);
            throw error;
        }
    }
}
