import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { CronService } from '@core/cron/cron.service';
import { PrismaService } from '@core/prisma/prisma.service';
import { NotificationGateway } from '../../../notifications/notification.gateway';
import { NotificationService } from '../../../notifications/notification.service';

@Injectable()
export class OrdemServicoCronService implements OnModuleInit {
    private readonly logger = new Logger(OrdemServicoCronService.name);

    constructor(
        private cronService: CronService,
        private prisma: PrismaService,
        private notificationService: NotificationService,
        private notificationGateway: NotificationGateway
    ) { }

    async onModuleInit() {
        this.logger.log('Inicializando OrdemServico Cron Service');
        await this.registerNotificationJob();
    }

    async registerNotificationJob() {
        try {
            const schedules = await this.prisma.$queryRawUnsafe<any[]>(`
                SELECT * FROM mod_ordem_servico_notification_schedules
            `);

            const activeKeys = new Set<string>();

            for (const config of schedules) {
                const key = `ordemServico.auto_notification.${config.id}`;

                if (config.enabled) {
                    await this.cronService.register(
                        key,
                        config.cron_expression,
                        async () => {
                            await this.executeNotificationJob(config);
                        },
                        {
                            name: 'Notif: ' + config.title,
                            description: 'Notificacao automatica do Ordem de Servico',
                            settingsUrl: '/modules/ordem_servico/pages/configuracoes',
                        }
                    );
                    activeKeys.add(key);
                } else {
                    this.cronService.delete(key);
                }
            }

            this.cronService.delete('ordemServico.auto_notification');

            const allJobs = await this.cronService.listJobs();
            for (const job of allJobs) {
                if (job.key.startsWith('ordemServico.auto_notification.') && !activeKeys.has(job.key)) {
                    this.cronService.delete(job.key);
                }
            }
        } catch (e) {
            this.logger.error('Erro ao registrar jobs:', e);
        }
    }

    private async executeNotificationJob(config: any) {
        this.logger.log(`Executando Notificacao automatica: ${config.title}`);

        try {
            const recipients = await this.resolveScheduleRecipients(config);
            if (recipients.length === 0) {
                this.logger.warn(`Nenhum destinatario valido encontrado para a notificacao agendada ${config.id}`);
                return;
            }

            let createdCount = 0;
            for (const userId of recipients) {
                const notification = await this.notificationService.createSystemNotificationEntity({
                    severity: 'info',
                    title: config.title,
                    body: config.content,
                    data: {
                        scheduleId: config.id,
                        audience: config.audience || 'all',
                    },
                    source: 'module',
                    module: 'ordem_servico',
                    tenantId: config.tenant_id,
                    userId,
                    targetUserId: userId,
                    targetRole: null,
                    type: 'SYSTEM_ALERT',
                });

                if (!notification) {
                    continue;
                }

                createdCount += 1;
                await this.notificationGateway.emitNewNotification(notification);
            }

            this.logger.log(`Notificacoes criadas com sucesso para ${createdCount} usuario(s).`);
        } catch (e) {
            this.logger.error('Erro ao criar notificacao:', e);
        }
    }

    private async resolveScheduleRecipients(config: any): Promise<string[]> {
        const tenantId = String(config?.tenant_id || '').trim();
        if (!tenantId) {
            return [];
        }

        const audience = String(config?.audience || 'all').trim().toLowerCase();

        if (audience.startsWith('user:')) {
            const userId = audience.slice(5).trim();
            return userId ? this.resolveExplicitUserIds([userId], tenantId) : [];
        }

        if (audience.startsWith('email:')) {
            const email = audience.slice(6).trim();
            if (!email) {
                return [];
            }
            const userId = await this.resolveUserIdByEmail(email, tenantId);
            return userId ? [userId] : [];
        }

        switch (audience) {
            case 'admin':
            case 'admins':
                return this.getTenantUserIdsByRoles(tenantId, ['ADMIN']);
            case 'technician':
            case 'technicians':
                return this.getTechnicianUserIds(tenantId);
            case 'super_admin':
            case 'super_admins':
                return this.getGlobalUserIdsByRoles(['SUPER_ADMIN']);
            case 'all':
            default:
                return this.getTenantUserIdsByRoles(tenantId, ['ADMIN', 'USER']);
        }
    }

    private async getTenantUserIdsByRoles(tenantId: string, roles: string[]): Promise<string[]> {
        const users = await this.prisma.user.findMany({
            where: {
                tenantId,
                role: { in: roles as any },
                isLocked: false,
            },
            select: { id: true },
        });

        return users.map((user) => user.id);
    }

    private async getGlobalUserIdsByRoles(roles: string[]): Promise<string[]> {
        const users = await this.prisma.user.findMany({
            where: {
                role: { in: roles as any },
                isLocked: false,
            },
            select: { id: true },
        });

        return users.map((user) => user.id);
    }

    private async getTechnicianUserIds(tenantId: string): Promise<string[]> {
        const technicians = await this.prisma.$queryRawUnsafe<any[]>(
            `SELECT u.id
             FROM users u
             INNER JOIN mod_ordem_servico_user_roles osr ON u.id = osr.user_id AND u."tenantId" = osr.tenant_id
             WHERE u."tenantId" = $1 AND u."isLocked" = false AND osr.is_technician = true`,
            tenantId
        );

        return technicians.map((technician) => technician.id);
    }

    private async resolveExplicitUserIds(userIds: string[], tenantId: string): Promise<string[]> {
        const users = await this.prisma.user.findMany({
            where: {
                id: { in: userIds },
                tenantId,
                isLocked: false,
            },
            select: { id: true },
        });

        return users.map((user) => user.id);
    }

    private async resolveUserIdByEmail(email: string, tenantId: string): Promise<string | null> {
        const user = await this.prisma.user.findFirst({
            where: {
                email,
                tenantId,
                isLocked: false,
            },
            select: { id: true },
        });

        return user?.id ?? null;
    }
}
