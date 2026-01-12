'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';
import api from '@/lib/api';
import { OrdemServico, StatusOS, STATUS_LABELS, STATUS_COLORS, OrigemSolicitacao, ORIGEM_LABELS } from '../types/ordem-servico.types';

interface Props {
    clientId: string;
    clientName: string;
}

// Função para validar UUID
const isValidUUID = (uuid: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
};

export default function ClientOrdersList({ clientId, clientName }: Props) {
    const [orders, setOrders] = useState<OrdemServico[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchOrders = async () => {
        if (!clientId) {
            setOrders([]);
            setError(null);
            return;
        }

        // Validar UUID antes de fazer a requisição
        if (!isValidUUID(clientId)) {
            setError('ID de cliente inválido');
            setOrders([]);
            return;
        }

        setLoading(true);
        setError(null);
        
        try {
            const response = await api.get(`/api/ordem_servico/ordens?cliente_id=${clientId}`);
            
            // Tratar resposta com paginação
            const data = response.data?.data || response.data || [];
            setOrders(Array.isArray(data) ? data : []);
        } catch (err: any) {
            console.error('Erro ao buscar ordens do cliente:', err);
            
            // Mensagens de erro mais amigáveis
            if (err.response?.status === 400) {
                setError('ID de cliente inválido. Por favor, verifique os dados.');
            } else if (err.response?.status === 404) {
                setError('Cliente não encontrado.');
            } else if (err.response?.status === 500) {
                setError('Erro no servidor. Por favor, tente novamente.');
            } else {
                setError('Erro ao carregar ordens do cliente.');
            }
            
            setOrders([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, [clientId]);

    const formatCurrency = (value: number) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

    const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('pt-BR');

    const getStatusBadge = (status: StatusOS) => {
        const colorClass = STATUS_COLORS[status];
        return <Badge className={`${colorClass} text-white`}>{STATUS_LABELS[status]}</Badge>;
    };

    return (
        <Card className="shadow-sm border-2">
            <CardHeader className="bg-muted/20 pb-4">
                <CardTitle className="text-lg">Ordens do Cliente</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
                {loading ? (
                    <div className="flex justify-center py-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center py-6 space-y-4">
                        <AlertCircle className="h-12 w-12 text-destructive" />
                        <p className="text-sm text-destructive text-center">{error}</p>
                        <Button 
                            onClick={fetchOrders} 
                            variant="outline" 
                            size="sm"
                            className="gap-2"
                        >
                            <RefreshCw className="h-4 w-4" />
                            Tentar Novamente
                        </Button>
                    </div>
                ) : orders.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhuma ordem encontrada para este cliente.</p>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nº</TableHead>
                                <TableHead>Tipo de Serviço</TableHead>
                                <TableHead>Data Abertura</TableHead>
                                <TableHead>Valor</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Origem</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {orders.map((ord) => (
                                <TableRow key={ord.id}>
                                    <TableCell className="font-mono font-medium">#{ord.numero}</TableCell>
                                    <TableCell>{ord.tipo_servico}</TableCell>
                                    <TableCell>{formatDate(ord.data_abertura)}</TableCell>
                                    <TableCell>{formatCurrency(ord.valor_servico)}</TableCell>
                                    <TableCell>{getStatusBadge(ord.status)}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{ORIGEM_LABELS[ord.origem_solicitacao]}</Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    );
}
