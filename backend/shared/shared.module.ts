import { Module } from '@nestjs/common';
import { PrismaModule } from '@core/prisma/prisma.module';
import { PermissionService } from './services/permission.service';
import { TemplateService } from './services/template.service';
import { PermissionController } from './controllers/permission.controller';
import { TemplateController } from './controllers/template.controller';
import { PermissionGuard } from './guards/permission.guard';

@Module({
    imports: [PrismaModule],
    controllers: [PermissionController, TemplateController],
    providers: [PermissionService, TemplateService, PermissionGuard],
    exports: [PermissionService, TemplateService, PermissionGuard],
})
export class SharedModule {}