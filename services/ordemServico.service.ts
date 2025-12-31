import { Injectable } from '@nestjs/common';

@Injectable()
export class OrdemServicoService {
    async findAll(tenantId: string, filters: any) {
        return {
            success: true,
            data: [],
            message: 'Módulo Ordem de Serviço funcionando'
        };
    }

    async getStats(tenantId: string) {
        return {
            success: true,
            data: {
                module: 'ordem_servico',
                version: '1.0.0',
                status: 'active'
            }
        };
    }
}
