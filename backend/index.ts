// Módulo principal
export * from './ordem_servico.module';

// Submódulos
export * from './clientes/src/clientes.module';
export * from './produtos/src/produtos.module';
export * from './ordens/src/ordens.module';
export * from './configuracoes/configuracoes.module';
export * from './shared/shared.module';
export * from './core/core.module';

// Controllers
export * from './clientes/src/clientes.controller';
export * from './produtos/src/produtos.controller';
export * from './ordens/src/ordens.controller';
export * from './configuracoes/configuracoes.controller';
export * from './shared/controllers/permission.controller';
export * from './shared/controllers/template.controller';
export * from './core/ordem-servico-config.controller';

// Services
export * from './clientes/src/clientes.service';
export * from './produtos/src/produtos.service';
export * from './ordens/src/ordens.service';
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

// Client module interfaces and tokens (for cross-module integration)
export * from './shared/interfaces/cliente-lookup.interface';
export * from './shared/interfaces/cliente-deletion-guard.interface';
export * from './shared/constants/injection-tokens';
export * from './shared/clients-integration.module';
export * from './clientes/src/contracts/cliente.api';

const moduleContract = {
    moduleApiVersion: 1,
    name: 'ordem_servico',
    slug: 'ordem_servico',
    version: '1.0.0',
    displayName: 'Ordem de Servicos',
    description: 'Modulo de gerenciamento de ordens de servico.',
    author: 'GOR Informatica',
    icon: 'FileCog',
    navigation: {
        order: 2,
    },
    enabled: true,
    defaultConfig: {
        showNotifications: true,
        enableWidgets: true,
        maxItems: 50,
    },
    register(context: any) {
        const routeRoot = '/modules/ordem_servico/pages';
        const ALL_ROLES = ['SUPER_ADMIN', 'ADMIN', 'USER', 'TECH'];

        const menuItems = [
            {
                id: 'ordem_servico-dashboard',
                label: 'Dashboard',
                href: `${routeRoot}/dashboard`,
                icon: 'BarChart3',
                roles: ALL_ROLES,
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
                roles: ALL_ROLES,
                placement: 'sidebar',
                order: 2,
                module: 'ordem_servico',
            },
            {
                id: 'ordem_servico-clientes',
                label: 'Clientes',
                href: `${routeRoot}/clientes`,
                icon: 'Users',
                roles: ALL_ROLES,
                placement: 'sidebar',
                order: 3,
                module: 'ordem_servico',
            },
            {
                id: 'ordem_servico-produtos',
                label: 'Produtos / Servicos',
                href: `${routeRoot}/produtos`,
                icon: 'Package',
                roles: ALL_ROLES,
                placement: 'sidebar',
                order: 4,
                module: 'ordem_servico',
            },
            {
                id: 'ordem_servico-configuracoes',
                label: 'Configuracoes',
                href: `${routeRoot}/configuracoes`,
                icon: 'Settings',
                roles: ['SUPER_ADMIN', 'ADMIN'],
                placement: 'topbar',
                order: 5,
                module: 'ordem_servico',
            },
        ];

        if (context?.menu?.add) {
            menuItems.forEach((item) => context.menu.add(item));
        }

        if (context?.clientMenu?.add) {
            context.clientMenu.add({
                id: 'os-aba',
                label: 'Ordens de Servico',
                component: 'ClientOrdersList',
                module: 'ordem_servico',
                roles: ALL_ROLES
            });
        }

        if (context?.taskbar?.add) {
            context.taskbar.add({
                id: 'alertas-retirada-os',
                component: 'AlertaRetiradaBadge',
                module: 'ordem_servico',
                roles: ALL_ROLES
            });
        }

        if (context?.dashboard?.addWidget) {
            context.dashboard.addWidget({
                id: 'ordem_servico-status',
                title: 'Status Ordem de Servicos',
                component: 'MeuModuloWidget',
                gridSize: { w: 1, h: 1 },
                order: 1,
                module: 'ordem_servico',
                roles: ALL_ROLES,
                refresh: 60000,
            });
        }

        if (context?.logger?.info) {
            context.logger.info('Modulo ordem_servico registrado com permissoes baseadas em roles.');
        }
    },
};

export default moduleContract;
