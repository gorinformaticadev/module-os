import React from 'react';
import { FrontendModuleDefinition } from '@/lib/module-types';
import { MeuModuloWidget } from './components/MeuModuloWidget';
import {
    MODULE_DISPLAY_NAME,
    MODULE_ICON,
    MODULE_MENU_ENTRIES,
    MODULE_NAME,
    MODULE_ROUTE_ROOT,
    MODULE_SLUG,
    MODULE_VERSION,
} from './module-manifest';

export { default as moduloOsConfiguracoesPage } from './pages/configuracoes';

type CompatibilityModuleContribution = {
    id: string;
    name: string;
    version: string;
    enabled: boolean;
    sidebar?: Array<{
        id: string;
        name: string;
        href: string;
        icon: string;
        order: number;
    }>;
    dashboard?: Array<{
        id: string;
        name: string;
        component: string;
        order: number;
        icon: string;
        description: string;
        route: string;
        actionLabel: string;
        kind: 'summary' | 'list' | 'kanban';
        size: 'small' | 'medium' | 'large';
        stats: Array<{
            label: string;
            value: string;
        }>;
        items: Array<{
            id: string;
            label: string;
            value: string;
            column: string;
            tone: 'neutral' | 'good' | 'warn' | 'danger';
        }>;
    }>;
};

const legacyWidget = {
    id: `${MODULE_SLUG}-status`,
    type: 'summary_card' as const,
    title: 'Status Ordem de Servicos',
    component: MeuModuloWidget,
    gridSize: { w: 1, h: 1 },
    order: 1,
    icon: MODULE_ICON,
};

export const moduloOsModule: FrontendModuleDefinition = {
    id: MODULE_SLUG,
    name: MODULE_DISPLAY_NAME,
    widgets: [legacyWidget],
};

export const moduloOsContribution: CompatibilityModuleContribution = {
    id: MODULE_SLUG,
    name: MODULE_NAME,
    version: MODULE_VERSION,
    enabled: true,
    sidebar: MODULE_MENU_ENTRIES.map((entry) => ({
        id: entry.id,
        name: entry.label,
        href: entry.route,
        icon: entry.icon,
        order: entry.order,
    })),
    dashboard: [
        {
            id: 'status',
            name: 'Operacao de OS',
            component: 'MeuModuloWidget',
            order: 1,
            icon: MODULE_ICON,
            description: 'Resumo operacional do modulo de ordens de servico.',
            route: `${MODULE_ROUTE_ROOT}/dashboard`,
            actionLabel: 'Abrir dashboard',
            kind: 'summary',
            size: 'medium',
            stats: [
                { label: 'Modulo', value: 'Ativo' },
                { label: 'Menus', value: String(MODULE_MENU_ENTRIES.length) },
                { label: 'Entrada', value: 'Dashboard' },
            ],
            items: MODULE_MENU_ENTRIES.slice(0, 4).map((entry) => ({
                id: entry.id,
                label: entry.label,
                value: entry.route,
                column: 'Atalhos',
                tone: 'neutral',
            })),
        },
    ],
};

export default moduloOsContribution;
