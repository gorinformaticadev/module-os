import { Module } from '@nestjs/common';
import { ClientesModule } from './clientes/src/clientes.module';
import { ProdutosModule } from './produtos/src/produtos.module';
import { OrdensModule } from './ordens/src/ordens.module';
import { ConfiguracoesModule } from './configuracoes/configuracoes.module';
import { SharedModule } from './shared/shared.module';
import { CoreModule } from './core/core.module';
import { PrismaModule } from '@core/prisma/prisma.module';
import { AuditModule } from '@core/audit/audit.module';

import { OrdemServicoNotificationsModule } from './notifications/notifications.module';

@Module({
    imports: [
        PrismaModule,
        AuditModule,
        SharedModule,
        CoreModule,
        ClientesModule,
        ProdutosModule,
        OrdensModule,
        ConfiguracoesModule,
        OrdemServicoNotificationsModule,
    ],
    exports: [
        ClientesModule,
        ProdutosModule,
        OrdensModule,
        ConfiguracoesModule,
        SharedModule,
        CoreModule,
    ],
})
export class OrdemServicoModule {
    static SLUG = 'ordem_servico';
}
