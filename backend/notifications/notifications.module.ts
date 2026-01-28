import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { NotificationRuleService } from './rules.service';
import { NotificationHistoryService } from './history.service';
import { NotificationStateService } from './state.service';
import { NotificationDispatcherService, EmailStrategy, WhatsAppStrategy } from './dispatcher.service';
import { NotificationSchedulerService } from './scheduler.service';
import { PrismaModule } from '../../../core/prisma/prisma.module';

import { NotificationEventListenerService } from './event-listener.service';
import { NotificationRuleController } from './rules.controller';

@Module({
    imports: [
        PrismaModule,
        EventEmitterModule,
        ScheduleModule,
    ],
    controllers: [NotificationRuleController],
    providers: [
        NotificationRuleService,
        NotificationHistoryService,
        NotificationStateService,
        NotificationDispatcherService,
        EmailStrategy,
        WhatsAppStrategy,
        NotificationSchedulerService,
        NotificationEventListenerService,
    ],
    exports: [
        NotificationRuleService,
        NotificationHistoryService,
        NotificationDispatcherService,
    ],
})
export class NotificationsModule { }
