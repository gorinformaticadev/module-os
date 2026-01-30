import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';

@Injectable()
export class NotificationHistoryService {
    private readonly logger = new Logger(NotificationHistoryService.name);

    constructor(private readonly prisma: PrismaService) { }

    async findAll(tenantId: string, filters?: any) {
        const { ruleId, ordemServicoId, status } = filters || {};

        let query = `SELECT * FROM mod_ordem_servico_notif_history WHERE tenant_id = $1`;
        const values: any[] = [tenantId];
        let placeholder = 2;

        if (ruleId) {
            query += ` AND rule_id = $${placeholder++}`;
            values.push(ruleId);
        }
        if (ordemServicoId) {
            query += ` AND ordem_servico_id = $${placeholder++}`;
            values.push(ordemServicoId);
        }
        if (status) {
            query += ` AND status = $${placeholder++}`;
            values.push(status);
        }

        query += ` ORDER BY sent_at DESC LIMIT 100`;

        return this.prisma.$queryRawUnsafe(query, ...values);
    }

    async log(data: {
        tenantId: string;
        ruleId: string;
        ordemServicoId?: string;
        channel: string;
        recipient: string;
        content: string;
        status: 'SUCCESS' | 'ERROR' | 'PAUSED' | 'EXPIRED';
        errorMessage?: string;
        fingerprint?: string;
    }) {
        try {
            await this.prisma.$queryRawUnsafe(
                `INSERT INTO mod_ordem_servico_notif_history (
                    tenant_id, rule_id, ordem_servico_id, channel, 
                    recipient, content, status, error_message, fingerprint
                ) VALUES ($1, $2::uuid, $3::uuid, $4, $5, $6, $7, $8, $9)`,
                data.tenantId, data.ruleId, data.ordemServicoId, data.channel,
                data.recipient, data.content, data.status, data.errorMessage, data.fingerprint
            );
        } catch (error) {
            this.logger.error('Erro ao logar histórico de notificação:', error);
        }
    }
}
