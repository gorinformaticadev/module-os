import { Global, Module } from "@nestjs/common";
import { ModuleOsPrismaModule } from "../prisma/module-os-prisma.module";
import { ClientesModule } from "../clientes/src/clientes.module";
import { ClientesService } from "../clientes/src/clientes.service";
import { OrdemDeletionGuard } from "../ordens/src/guards/ordem-deletion-guard.provider";
import {
  CLIENTES_SERVICE,
  CLIENTE_DELETION_GUARD,
} from "./constants/injection-tokens";

@Global()
@Module({
  imports: [ClientesModule, ModuleOsPrismaModule],
  providers: [
    {
      provide: CLIENTES_SERVICE,
      useExisting: ClientesService,
    },
    OrdemDeletionGuard,
    {
      provide: CLIENTE_DELETION_GUARD,
      useExisting: OrdemDeletionGuard,
    },
  ],
  exports: [CLIENTES_SERVICE, CLIENTE_DELETION_GUARD, ClientesModule],
})
export class ClientsIntegrationModule {}
