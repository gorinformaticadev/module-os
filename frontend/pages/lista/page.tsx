"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, Edit, Trash2, Eye } from 'lucide-react';

export default function moduloOsListaPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const mockData = [
    { id: 1, name: 'Item 1', status: 'Ativo', date: '28/12/2025', category: 'Categoria A' },
    { id: 2, name: 'Item 2', status: 'Inativo', date: '27/12/2025', category: 'Categoria B' },
    { id: 3, name: 'Item 3', status: 'Ativo', date: '26/12/2025', category: 'Categoria A' },
    { id: 4, name: 'Item 4', status: 'Ativo', date: '25/12/2025', category: 'Categoria C' },
    { id: 5, name: 'Item 5', status: 'Pendente', date: '24/12/2025', category: 'Categoria B' },
  ];

  const filteredData = mockData.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Lista de Itens</h1>
          <p className="text-muted-foreground mt-2">
            Gerencie todos os itens do módulo
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Item
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Itens Cadastrados</CardTitle>
          <CardDescription>
            Lista completa de todos os itens do módulo
          </CardDescription>
          <div className="pt-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar itens..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-slate-900">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Nome</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Categoria</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Data</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredData.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                        Nenhum item encontrado
                      </td>
                    </tr>
                  ) : (
                    filteredData.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                        <td className="px-4 py-3 text-sm font-medium">{item.name}</td>
                        <td className="px-4 py-3 text-sm">{item.category}</td>
                        <td className="px-4 py-3 text-sm">
                          <Badge
                            variant={
                              item.status === 'Ativo' ? 'default' :
                              item.status === 'Inativo' ? 'secondary' :
                              'outline'
                            }
                          >
                            {item.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{item.date}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-2">
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-600 hover:text-red-700">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex items-center justify-between mt-6">
            <p className="text-sm text-muted-foreground">
              Mostrando {filteredData.length} de {mockData.length} itens
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled>
                Anterior
              </Button>
              <Button variant="outline" size="sm">
                Próximo
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
