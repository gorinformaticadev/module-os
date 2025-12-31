import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Box } from 'lucide-react';

export function moduloOsWidget() {
    return (
        <Card className="h-full border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Status Ordem de Serviços</CardTitle>
                <Box className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold text-blue-600">Ativo</div>
                <p className="text-xs text-muted-foreground mt-1">
                    Módulo operando normalmente
                </p>
            </CardContent>
        </Card>
    );
}
