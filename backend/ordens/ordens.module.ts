import { Module } from '@nestjs/common';
import { OrdensController } from './ordens.controller';
import { OrdensService } from './ordens.service';
import { PrismaModule } from '@core/prisma/prisma.module';
import { SharedModule } from '../shared/shared.module';

@Module({
    imports: [PrismaModule, SharedModule],
    controllers: [OrdensController],
    providers: [OrdensService],
    exports: [OrdensService],
})
export class OrdensModule {}