"use client";

import React from 'react';

export default function OrdemServicoListaPage() {
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Lista - Ordem de Serviços</h1>
          <p className="text-muted-foreground mt-2">
            Lista de todas as ordens de serviço
          </p>
        </div>
      </div>

      <div className="text-center py-16 text-muted-foreground">
        <p>Página em desenvolvimento...</p>
      </div>
    </div>
  );
}