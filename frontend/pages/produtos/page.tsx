"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export default function OrdemServicoProdutosPage() {
    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Produtos e Serviços</h1>
                    <p className="text-muted-foreground mt-2">
                        Catálogo de produtos e serviços disponíveis
                    </p>
                </div>
                <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Novo Item
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Catálogo</CardTitle>
                    <CardDescription>
                        Gerencie seus produtos e serviços
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center p-8 text-muted-foreground">
                        Módulo de Produtos/Serviços em desenvolvimento
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
