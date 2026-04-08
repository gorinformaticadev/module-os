import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { NotificationRuleService } from './rules.service';
import { NotificationHistoryService } from './history.service';
import { NotificationStateService } from './state.service';
import { NotificationDispatcherService, EmailStrategy, WhatsAppStrategy, SystemStrategy } from './dispatcher.service';
import { NotificationSchedulerService } from './scheduler.service';
import { PrismaModule } from '../../../core/prisma/prisma.module';
import { ModuleOsPrismaModule } from '../prisma/module-os-prisma.module';

import { NotificationEventListenerService } from './event-listener.service';
import { NotificationRuleController } from './rules.controller';
import { NotificationsModule as RootNotificationsModule } from '../../../notifications/notifications.module';
import { SharedModule } from '../shared/shared.module';

@Module({
    imports: [
        PrismaModule,
        ModuleOsPrismaModule,
        EventEmitterModule,
        ScheduleModule,
        RootNotificationsModule,
        SharedModule,
    ],
    controllers: [NotificationRuleController],
    providers: [
        NotificationRuleService,
        NotificationHistoryService,
        NotificationStateService,
        NotificationDispatcherService,
        EmailStrategy,
        WhatsAppStrategy,
        SystemStrategy,
        NotificationSchedulerService,
        NotificationEventListenerService,
    ],
    exports: [
        NotificationRuleService,
        NotificationHistoryService,
        NotificationDispatcherService,
    ],
})
export class OrdemServicoNotificationsModule { }
