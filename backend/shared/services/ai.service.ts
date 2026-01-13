import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@core/prisma/prisma.service';

interface AIRequest {
    prompt: string;
    system?: string;
}

@Injectable()
export class AiService {
    private readonly logger = new Logger(AiService.name);

    constructor(private readonly prisma: PrismaService) { }

    private async getAiConfig(tenantId: string) {
        try {
            const results = await this.prisma.$queryRawUnsafe<any[]>(
                `SELECT value FROM mod_ordem_servico_configs WHERE tenant_id = $1 AND key = 'ai_integration'`,
                tenantId
            );

            if (results.length === 0) {
                return null;
            }

            return JSON.parse(results[0].value);
        } catch (error) {
            this.logger.error(`❌ Erro ao buscar configuração de IA:`, error);
            return null;
        }
    }

    async callAI(tenantId: string, { prompt, system }: AIRequest) {
        const config = await this.getAiConfig(tenantId);

        if (!config || !config.enabled) {
            throw new BadRequestException('IA não habilitada para este tenant');
        }

        if (!config.apiKey) {
            throw new BadRequestException('API Key da IA não configurada');
        }

        const url = config.provider === 'openrouter'
            ? 'https://openrouter.ai/api/v1/chat/completions'
            : 'https://api.openai.com/v1/chat/completions';

        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.apiKey}`,
        };

        if (config.provider === 'openrouter') {
            headers['HTTP-Referer'] = 'https://github.com/Projeto-menu-multitenant-seguro';
            headers['X-Title'] = 'Sistema OS Multitenant';
        }

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    model: config.model || (config.provider === 'openrouter' ? 'openai/gpt-3.5-turbo' : 'gpt-3.5-turbo'),
                    temperature: config.temperature ?? 0.3,
                    max_tokens: config.maxTokens ?? 800,
                    messages: [
                        system ? { role: 'system', content: system } : null,
                        { role: 'user', content: prompt },
                    ].filter(Boolean),
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                this.logger.error(`Erro na API de IA (${config.provider}):`, errorData);
                throw new Error(`Erro na API de IA: ${response.statusText}`);
            }

            const data = await response.json();
            return data.choices[0].message.content;
        } catch (error) {
            this.logger.error(`Erro ao chamar IA:`, error);
            throw error;
        }
    }
}
