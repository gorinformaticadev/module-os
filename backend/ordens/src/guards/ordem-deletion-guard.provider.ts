import { Injectable } from '@nestjs/common';
import { ModuleOsPrismaService } from '../../../prisma/module-os-prisma.service';
import { IClienteDeletionGuard } from '../../../shared/interfaces/cliente-deletion-guard.interface';

@Injectable()
export class OrdemDeletionGuard implements IClienteDeletionGuard {
    constructor(private readonly prisma: ModuleOsPrismaService) {}

    async canDelete(clienteId: string): Promise<{ allowed: boolean; reason?: string }> {
        const count = await this.prisma.mod_ordem_servico_ordens.count({
            where: { clienteId },
        });

        if (count > 0) {
            return {
                allowed: false,
                reason: 'Nao e possivel excluir o cliente pois existem Ordens de Servico associadas a ele.',
            };
        }

        return { allowed: true };
    }
}
