import { Module } from "@nestjs/common";
import { OrdensController } from "./ordens.controller";
import { OrdensService } from "./ordens.service";
import { PrismaModule } from "@core/prisma/prisma.module";
import { SharedModule } from "../../shared/shared.module";
import { ModuleOsPrismaModule } from "../../prisma/module-os-prisma.module";
import { OrdemRepository } from "./repositories/ordem.repository";
import { OrdemDeletionGuard } from "./guards/ordem-deletion-guard.provider";

@Module({
  imports: [PrismaModule, ModuleOsPrismaModule, SharedModule],
  controllers: [OrdensController],
  providers: [OrdensService, OrdemRepository, OrdemDeletionGuard],
  exports: [OrdensService, OrdemDeletionGuard],
})
export class OrdensModule {}
