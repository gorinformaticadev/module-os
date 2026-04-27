import { Module } from "@nestjs/common";
import { PrismaModule } from "@core/prisma/prisma.module";
import { PermissionService } from "./services/permission.service";
import { TemplateService } from "./services/template.service";
import { AiService } from "./services/ai.service";
import { PermissionController } from "./controllers/permission.controller";
import { TemplateController } from "./controllers/template.controller";
import { AiController } from "./controllers/ai.controller";
import { PermissionGuard } from "./guards/permission.guard";
import { ModuleOsPrismaModule } from "../prisma/module-os-prisma.module";

@Module({
  imports: [PrismaModule, ModuleOsPrismaModule],
  controllers: [PermissionController, TemplateController, AiController],
  providers: [PermissionService, TemplateService, AiService, PermissionGuard],
  exports: [PermissionService, TemplateService, AiService, PermissionGuard],
})
export class SharedModule {}
