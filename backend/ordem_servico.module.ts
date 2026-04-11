import { Module } from '@nestjs/common';
import { ProdutosModule } from './produtos/produtos.module';
import { OrdensModule } from './ordens/ordens.module';
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
        ProdutosModule,
        OrdensModule,
        ConfiguracoesModule,
        OrdemServicoNotificationsModule,
    ],
    exports: [
        ProdutosModule,
        OrdensModule,
        ConfiguracoesModule,
        SharedModule,
        CoreModule,
    ],
})
export class OrdemServicoModule {
    static SLUG = 'ordem_servico';

    constructor() {
        console.log('Modulo ORDEM_SERVICO carregado com todas as funcionalidades.');
    }
}
