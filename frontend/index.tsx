import React from 'react';
import { FrontendModuleDefinition } from '@/lib/module-types';
import { moduloOsWidget } from './components/moduloOsWidget';
export { default as moduloOsConfiguracoesPage } from './pages/configuracoes';

export const moduloOsModule: FrontendModuleDefinition = {
    id: 'moduloOs',
    name: 'Ordem de Serviços',

    widgets: [
        {
            id: 'moduloOs-status',
            type: 'summary_card',
            title: 'Status Ordem de Serviços',
            component: moduloOsWidget,
            gridSize: { w: 1, h: 1 },
            order: 1,
            icon: 'Box'
        }
    ]
};
