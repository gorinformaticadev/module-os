'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import api from '@/lib/api';
import { OrdemServico, StatusOS, STATUS_LABELS, STATUS_COLORS, OrigemSolicitacao, ORIGEM_LABELS } from '../types/ordem-servico.types';

interface Props {
    clientId: string;
    clientName: string;
}

export default function ClientOrdersList({ clientId, clientName }: Props) {
    const [orders, setOrders] = useState<OrdemServico[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchOrders = async () => {
            if (!clientId) return;
            setLoading(true);
            try {
                // The backend supports a generic search endpoint; we filter by client name.
                const response = await api.get(`/api/ordem_servico/ordens?cliente_id=${clientId}`);
                setOrders(response.data || []);
            } catch (error) {
                console.error('Erro ao buscar ordens do cliente:', error);
                setOrders([]);
            } finally {
                setLoading(false);
            }
        };
        fetchOrders();
    }, [clientId, clientName]);

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
