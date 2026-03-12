'use client';

import React, { useEffect, useState } from 'react';
import { AlertTriangle, Box, Loader2, Wrench, Keyboard } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
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
    return metrics.reduce((total: number, metric: DashboardMetric) => {
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
    const router = useRouter();
    const [metrics, setMetrics] = useState<DashboardMetric[]>([]);
    const [alertas, setAlertas] = useState<AlertaRetirada | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Atalhos de teclado (Shift + F1, F2, F3)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Só processa se Shift estiver pressionado
            if (!e.shiftKey) return;

            if (e.key === 'F1') {
                e.preventDefault();
                router.push('/modules/ordem_servico/pages/clientes?action=new');
            } else if (e.key === 'F2') {
                e.preventDefault();
                router.push('/modules/ordem_servico/pages/produtos?action=new');
            } else if (e.key === 'F3') {
                e.preventDefault();
                router.push('/modules/ordem_servico/pages/ordens/new');
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [router]);

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
                    const rawMetrics = (dashboardResponse.value as any)?.data;
                    setMetrics(Array.isArray(rawMetrics) ? rawMetrics : []);
                } else {
                    setMetrics([]);
                }

                if (alertasResponse.status === 'fulfilled') {
                    setAlertas((alertasResponse.value as any)?.data || null);
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

    const totalOrdens = metrics.reduce((total: number, metric: DashboardMetric) => total + Number(metric.quantidade || 0), 0);
    const ordensAtivas = sumByStatuses(metrics, ACTIVE_STATUSES);
    const ordensFinalizadas = sumByStatuses(metrics, [StatusOS.FINALIZADA]);
    const valorTotal = metrics.reduce((total: number, metric: DashboardMetric) => total + Number(metric.valor_total || 0), 0);
    const pendentesRetirada = Number(alertas?.total_pendentes || 0);

    return (
        <Card className="h-full border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Status Ordem de Servicos</CardTitle>
                <Wrench className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent className="space-y-3 flex-1 overflow-auto">
                {loading ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground p-4">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Carregando resumo operacional...</span>
                    </div>
                ) : (
                    <>
                        <div className="flex items-center justify-between gap-3 px-1">
                            <div>
                                <div className="text-2xl font-bold text-blue-600">
                                    {totalOrdens > 0 ? totalOrdens : 'Ativo'}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {totalOrdens > 0
                                        ? `${ordensAtivas} em andamento e ${ordensFinalizadas} finalizadas`
                                        : 'Modulo operando normalmente'}
                                </p>
                            </div>
                            <Box className="h-8 w-8 text-blue-200" />
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="rounded-md bg-muted/40 px-3 py-2">
                                <div className="text-muted-foreground">Ativas</div>
                                <div className="font-semibold">{ordensAtivas}</div>
                            </div>
                            <div className="rounded-md bg-muted/40 px-3 py-2">
                                <div className="text-muted-foreground">Finalizadas</div>
                                <div className="font-semibold">{ordensFinalizadas}</div>
                            </div>
                            <div className="rounded-md bg-muted/40 px-3 py-2">
                                <div className="text-muted-foreground">Retirada</div>
                                <div className="font-semibold">{pendentesRetirada}</div>
                            </div>
                            <div className="rounded-md bg-muted/40 px-3 py-2">
                                <div className="text-muted-foreground">Valor total</div>
                                <div className="font-semibold">{formatCurrency(valorTotal)}</div>
                            </div>
                        </div>

                        {pendentesRetirada > 0 ? (
                            <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                                <span>{pendentesRetirada} equipamento(s) aguardando retirada.</span>
                            </div>
                        ) : null}

                        {error ? (
                            <p className="text-xs text-muted-foreground">{error}</p>
                        ) : null}
                    </>
                )}
            </CardContent>
            
            {/* Legenda de Atalhos */}
            {!loading && (
                <div className="mt-auto border-t bg-slate-50/50 p-2 dark:bg-slate-900/20">
                    <div className="flex items-center gap-1.5 mb-1.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                        <Keyboard className="h-3 w-3" />
                        Atalhos Rápidos
                    </div>
                    <div className="grid grid-cols-1 gap-1">
                        <div className="flex items-center justify-between text-[11px]">
                            <span className="text-muted-foreground">Novo Cliente</span>
                            <kbd className="pointer-events-none inline-flex h-4 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                                <span className="text-[9px]">Shift</span> + F1
                            </kbd>
                        </div>
                        <div className="flex items-center justify-between text-[11px]">
                            <span className="text-muted-foreground">Novo Produto</span>
                            <kbd className="pointer-events-none inline-flex h-4 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                                <span className="text-[9px]">Shift</span> + F2
                            </kbd>
                        </div>
                        <div className="flex items-center justify-between text-[11px]">
                            <span className="text-muted-foreground">Nova OS</span>
                            <kbd className="pointer-events-none inline-flex h-4 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                                <span className="text-[9px]">Shift</span> + F3
                            </kbd>
                        </div>
                    </div>
                </div>
            )}
        </Card>
    );
}
