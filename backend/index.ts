// Módulo principal
export * from './ordem_servico.module';

// Submódulos
export * from './clientes/clientes.module';
export * from './produtos/produtos.module';
export * from './ordens/ordens.module';
export * from './configuracoes/configuracoes.module';
export * from './shared/shared.module';
export * from './core/core.module';

// Controllers
export * from './clientes/clientes.controller';
export * from './produtos/produtos.controller';
export * from './ordens/ordens.controller';
export * from './configuracoes/configuracoes.controller';
export * from './shared/controllers/permission.controller';
export * from './shared/controllers/template.controller';
export * from './core/ordem-servico-config.controller';

// Services
export * from './clientes/clientes.service';
export * from './produtos/produtos.service';
export * from './ordens/ordens.service';
export * from './configuracoes/configuracoes.service';
export * from './shared/services/permission.service';
export * from './shared/services/template.service';
export * from './core/ordem-servico-cron.service';

// Shared components
export * from './shared/guards/permission.guard';
export * from './shared/decorators/require-permission.decorator';
export * from './shared/dto/ordem-servico.dto';
export * from './shared/interfaces/permission.interface';
export * from './shared/constants/available-permissions';

const moduleContract = {
    moduleApiVersion: 1,
    name: 'ordem_servico',
    slug: 'ordem_servico',
    version: '3.1.0',
    displayName: 'Ordem de Servicos',
    description: 'Modulo de gerenciamento de ordens de servico.',
    author: 'GOR Informatica',
    icon: 'FileCog',
    enabled: true,
    defaultConfig: {
        showNotifications: true,
        enableWidgets: true,
        maxItems: 50,
    },
    register(context: any) {
        const routeRoot = '/modules/ordem_servico/pages';
        const menuItems = [
            {
                id: 'ordem_servico-dashboard',
                label: 'Dashboard',
                href: `${routeRoot}/dashboard`,
                icon: 'BarChart3',
                permission: 'ordem_servico.dashboard.view',
                placement: 'sidebar',
                isQuickAction: true,
                order: 1,
                module: 'ordem_servico',
            },
            {
                id: 'ordem_servico-ordens',
                label: 'Ordens de Servico',
                href: `${routeRoot}/ordens`,
                icon: 'ClipboardList',
                permission: 'ordem_servico.orders.view',
                placement: 'sidebar',
                order: 2,
                module: 'ordem_servico',
            },
            {
                id: 'ordem_servico-clientes',
                label: 'Clientes',
                href: `${routeRoot}/clientes`,
                icon: 'Users',
                permission: 'ordem_servico.clients.view',
                placement: 'sidebar',
                order: 3,
                module: 'ordem_servico',
            },
            {
                id: 'ordem_servico-produtos',
                label: 'Produtos / Servicos',
                href: `${routeRoot}/produtos`,
                icon: 'Package',
                permission: 'ordem_servico.products.view',
                placement: 'sidebar',
                order: 4,
                module: 'ordem_servico',
            },
            {
                id: 'ordem_servico-configuracoes',
                label: 'Configuracoes',
                href: `${routeRoot}/configuracoes`,
                icon: 'Settings',
                permission: 'ordem_servico.config.view',
                placement: 'topbar',
                order: 5,
                module: 'ordem_servico',
            },
        ];

        if (context?.menu?.add) {
            menuItems.forEach((item) => context.menu.add(item));
        }

        if (context?.dashboard?.addWidget) {
            context.dashboard.addWidget({
                id: 'ordem_servico-status',
                title: 'Status Ordem de Servicos',
                component: 'MeuModuloWidget',
                gridSize: { w: 1, h: 1 },
                order: 1,
                module: 'ordem_servico',
                permission: 'ordem_servico.dashboard.view',
                refresh: 60000,
            });
        }

        if (context?.logger?.info) {
            context.logger.info('Modulo ordem_servico registrado em modo compatibilidade.');
        }
    },
};

export default moduleContract;
