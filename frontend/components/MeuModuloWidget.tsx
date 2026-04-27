'use client';

import React, { useEffect, useState } from 'react';
import { AlertTriangle, Box, Loader2, Wrench } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ordem_servicoService } from '../services/ordem_servico.service';
import { AlertaRetirada, StatusOS } from '../types/ordem-servico.types';

type DashboardMetric = {
    status: number;
    quantidade: number;
    valor_total: number;
};

const ACTIVE_STATUSES = [
    StatusOS.ORCAMENTO,
    StatusOS.ABERTA,
    StatusOS.EM_ANALISE,
    StatusOS.AGUARDANDO_CLIENTE,
    StatusOS.AGUARDANDO_PECAS,
    StatusOS.EM_EXECUCAO,
];

function sumByStatuses(metrics: DashboardMetric[], statuses: number[]) {
    const statusSet = new Set(statuses);
    return metrics.reduce((total, metric) => {
        if (!statusSet.has(Number(metric.status))) {
            return total;
        }

        return total + Number(metric.quantidade || 0);
    }, 0);
}

function formatCurrency(value: number) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        maximumFractionDigits: 0,
    }).format(value || 0);
}

export function MeuModuloWidget() {
    const [metrics, setMetrics] = useState<DashboardMetric[]>([]);
    const [alertas, setAlertas] = useState<AlertaRetirada | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let mounted = true;

        const loadSummary = async () => {
            try {
                setLoading(true);
                setError(null);

                const [dashboardResponse, alertasResponse] = await Promise.allSettled([
                    ordem_servicoService.getDashboardData(),
                    ordem_servicoService.getAlertasRetirada(),
                ]);

                if (!mounted) {
                    return;
                }

                if (dashboardResponse.status === 'fulfilled') {
                    const rawMetrics = dashboardResponse.value?.data;
                    setMetrics(Array.isArray(rawMetrics) ? rawMetrics : []);
                } else {
                    setMetrics([]);
                }

                if (alertasResponse.status === 'fulfilled') {
                    setAlertas(alertasResponse.value?.data || null);
                } else {
                    setAlertas(null);
                }

                if (dashboardResponse.status === 'rejected' && alertasResponse.status === 'rejected') {
                    setError('Resumo indisponivel no momento.');
                }
            } catch (loadError) {
                if (!mounted) {
                    return;
                }

                console.error('Erro ao carregar widget do modulo:', loadError);
                setMetrics([]);
                setAlertas(null);
                setError('Resumo indisponivel no momento.');
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        };

        void loadSummary();

        return () => {
            mounted = false;
        };
    }, []);

    const totalOrdens = metrics.reduce((total, metric) => total + Number(metric.quantidade || 0), 0);
    const ordensAtivas = sumByStatuses(metrics, ACTIVE_STATUSES);
    const ordensFinalizadas = sumByStatuses(metrics, [StatusOS.FINALIZADA]);
    const valorTotal = metrics.reduce((total, metric) => total + Number(metric.valor_total || 0), 0);
    const pendentesRetirada = Number(alertas?.total_pendentes || 0);

    return (
        <Card className="h-full border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Status Ordem de Servicos</CardTitle>
                <Wrench className="h-4 w-4 text-skin-info" />
            </CardHeader>
            <CardContent className="space-y-3">
                {loading ? (
                    <div className="flex items-center gap-2 text-sm text-skin-text-muted">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Carregando resumo operacional...</span>
                    </div>
                ) : (
                    <>
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <div className="text-2xl font-bold text-skin-info">
                                    {totalOrdens > 0 ? totalOrdens : 'Ativo'}
                                </div>
                                <p className="text-xs text-skin-text-muted mt-1">
                                    {totalOrdens > 0
                                        ? `${ordensAtivas} em andamento e ${ordensFinalizadas} finalizadas`
                                        : 'Modulo operando normalmente'}
                                </p>
                            </div>
                            <Box className="h-8 w-8 text-skin-info" />
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="rounded-md bg-muted/40 px-3 py-2">
                                <div className="text-skin-text-muted">Ativas</div>
                                <div className="font-semibold">{ordensAtivas}</div>
                            </div>
                            <div className="rounded-md bg-muted/40 px-3 py-2">
                                <div className="text-skin-text-muted">Finalizadas</div>
                                <div className="font-semibold">{ordensFinalizadas}</div>
                            </div>
                            <div className="rounded-md bg-muted/40 px-3 py-2">
                                <div className="text-skin-text-muted">Retirada</div>
                                <div className="font-semibold">{pendentesRetirada}</div>
                            </div>
                            <div className="rounded-md bg-muted/40 px-3 py-2">
                                <div className="text-skin-text-muted">Valor total</div>
                                <div className="font-semibold">{formatCurrency(valorTotal)}</div>
                            </div>
                        </div>

                        {pendentesRetirada > 0 ? (
                            <div className="flex items-start gap-2 rounded-md border border-skin-warning bg-skin-warning/10 px-3 py-2 text-xs text-skin-warning-hover">
                                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                                <span>{pendentesRetirada} equipamento(s) aguardando retirada.</span>
                            </div>
                        ) : null}

                        {error ? (
                            <p className="text-xs text-skin-text-muted">{error}</p>
                        ) : null}
                    </>
                )}
            </CardContent>
        </Card>
    );
}
