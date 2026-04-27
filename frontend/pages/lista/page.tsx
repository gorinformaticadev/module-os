"use client";

import React from 'react';
import { ModulePageGuard } from '../../components/ModulePageGuard';

export default function OrdemServicoListaPage() {
  return (
    <ModulePageGuard resource="orders" action="view">
      <div className="mx-auto max-w-7xl space-y-8 p-8">
        <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-3xl font-bold">Lista - Ordem de Servicos</h1>
            <p className="mt-2 text-skin-text-muted">Lista de todas as ordens de servico</p>
          </div>
        </div>

        <div className="py-16 text-center text-skin-text-muted">
          <p>Pagina em desenvolvimento...</p>
        </div>
      </div>
    </ModulePageGuard>
  );
}
