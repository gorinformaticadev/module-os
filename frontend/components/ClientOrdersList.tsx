'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw, Eye } from 'lucide-react';
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

    const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('pt-BR');

    const handleViewOrder = (orderId: string, orderNumber: string) => {
        // TODO: Implementar visualização da ordem
        console.log(`Visualizar ordem ${orderNumber} (ID: ${orderId})`);
        // Aqui será implementada a navegação ou modal para visualizar a ordem
    };

    return (
        <div className="mt-3 p-3 bg-muted/30 rounded-md border border-muted-foreground/20">
            <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-foreground">
                    Ordens Anteriores ({orders.length})
                </h4>
                {loading && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
                )}
            </div>

            {error ? (
                <div className="flex flex-col items-center justify-center py-4 space-y-2">
                    <AlertCircle className="h-8 w-8 text-destructive" />
                    <p className="text-xs text-destructive text-center">{error}</p>
                    <Button 
                        onClick={fetchOrders} 
                        variant="outline" 
                        size="sm"
                        className="gap-1 h-7 text-xs"
                    >
                        <RefreshCw className="h-3 w-3" />
                        Tentar Novamente
                    </Button>
                </div>
            ) : orders.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-2">
                    Nenhuma ordem anterior encontrada.
                </p>
            ) : (
                <div className="space-y-2 max-h-32 overflow-y-auto">
                    {orders.map((order) => (
                        <div 
                            key={order.id}
                            className="flex items-center justify-between p-2 bg-background/50 rounded border border-muted-foreground/10 hover:bg-background/80 transition-colors"
                        >
                            <div className="flex flex-col min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                    <span className="font-mono text-xs font-semibold text-primary">
                                        #{order.numero}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                        {formatDate(order.data_abertura)}
                                    </span>
                                </div>
                            </div>
                            
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 hover:bg-primary/10 hover:text-primary"
                                onClick={() => handleViewOrder(order.id, order.numero)}
                                title={`Visualizar ordem #${order.numero}`}
                            >
                                <Eye className="h-3 w-3" />
                            </Button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
