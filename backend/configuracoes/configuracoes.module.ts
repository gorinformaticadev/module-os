import { Module } from '@nestjs/common';
import { ConfiguracoesController } from './configuracoes.controller';
import { ConfiguracoesService } from './configuracoes.service';
import { TiposServicoController } from './tipos-servico.controller';
import { TiposServicoService } from './tipos-servico.service';
import { TiposEquipamentoController } from './tipos-equipamento.controller';
import { TiposEquipamentoService } from './tipos-equipamento.service';
import { PrismaModule } from '@core/prisma/prisma.module';
import { CoreModule } from '../core/core.module';
import { SharedModule } from '../shared/shared.module';

@Module({
    imports: [PrismaModule, SharedModule, CoreModule],
    controllers: [
        ConfiguracoesController,
        TiposServicoController,
        TiposEquipamentoController,
    ],
    providers: [
        ConfiguracoesService,
        TiposServicoService,
        TiposEquipamentoService,
    ],
    exports: [
        ConfiguracoesService,
        TiposServicoService,
        TiposEquipamentoService,
    ],
})
export class ConfiguracoesModule { }
