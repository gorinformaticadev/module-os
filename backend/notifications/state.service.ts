import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';

@Injectable()
export class NotificationStateService {
    private readonly logger = new Logger(NotificationStateService.name);

    constructor(private readonly prisma: PrismaService) { }

    async getState(tenantId: string, ruleId: string, ordemServicoId: string) {
        const results: any[] = await this.prisma.$queryRawUnsafe(
            `SELECT * FROM mod_ordem_servico_notif_states 
             WHERE tenant_id = $1 AND rule_id = $2 AND ordem_servico_id = $3`,
            tenantId, ruleId, ordemServicoId
        );
        return results[0] || null;
    }

    async saveState(data: {
        tenantId: string;
        ruleId: string;
        ordemServicoId: string;
        lastState: any;
    }) {
        await this.prisma.$queryRawUnsafe(
            `INSERT INTO mod_ordem_servico_notif_states (
                tenant_id, rule_id, ordem_servico_id, last_state, updated_at
            ) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
            ON CONFLICT (tenant_id, rule_id, ordem_servico_id) 
            DO UPDATE SET last_state = EXCLUDED.last_state, updated_at = CURRENT_TIMESTAMP`,
            data.tenantId, data.ruleId, data.ordemServicoId, JSON.stringify(data.lastState)
        );
    }

    async updateLastNotified(tenantId: string, ruleId: string, ordemServicoId: string) {
        await this.prisma.$queryRawUnsafe(
            `UPDATE mod_ordem_servico_notif_states 
             SET last_notified_at = CURRENT_TIMESTAMP 
             WHERE tenant_id = $1 AND rule_id = $2 AND ordem_servico_id = $3`,
            tenantId, ruleId, ordemServicoId
        );
    }
}
