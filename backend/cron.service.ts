import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { CronService } from '@core/cron/cron.service';
import { PrismaService } from '@core/prisma/prisma.service';

@Injectable()
export class OrdemServicoCronService implements OnModuleInit {
    private readonly logger = new Logger(OrdemServicoCronService.name);

    constructor(
        private cronService: CronService,
        private prisma: PrismaService
    ) { }

    async onModuleInit() {
        this.logger.log('Inicializando OrdemServico Cron Service');
        await this.ensureDatabaseTable();
        await this.registerNotificationJob();
    }

    private async ensureDatabaseTable() {
        try {
            await this.prisma.$executeRawUnsafe(`
                CREATE TABLE IF NOT EXISTS mod_ordemServico_notification_schedules (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    title VARCHAR(255) NOT NULL,
                    content TEXT,
                    audience VARCHAR(50) DEFAULT 'all',
                    cron_expression VARCHAR(100) NOT NULL,
                    enabled BOOLEAN DEFAULT true,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `);
        } catch (error) {
            this.logger.warn('Aviso ao verificar tabela mod_ordemServico_notification_schedules: ' + error.message);
        }
    }

    async registerNotificationJob() {
        try {
            const schedules = await this.prisma.$queryRawUnsafe<any[]>(`
                SELECT * FROM mod_ordemServico_notification_schedules
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
                            description: 'Notificação Automática do Ordem de Serviço',
                            settingsUrl: '/modules/ordem_servico/pages/configuracoes'
                        }
                    );
                    activeKeys.add(key);
                } else {
                    this.cronService.delete(key);
                }
            }

            this.cronService.delete('ordemServico.auto_notification');

            const allJobs = this.cronService.listJobs();
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
        this.logger.log(`Executando Notificação Automática: ${config.title}`);

        try {
            await this.prisma.notification.create({
                data: {
                    title: config.title,
                    message: config.content,
                    severity: 'info',
                    audience: config.audience || 'all',
                    source: 'module',
                    module: 'ordem_servico',
                    read: false
                }
            });
            this.logger.log(`Notificação criada com sucesso.`);
        } catch (e) {
            this.logger.error('Erro ao criar notificação:', e);
        }
    }
}
