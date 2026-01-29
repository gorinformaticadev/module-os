'use client';

import React, { useState, useEffect } from 'react';
import { ArrowRight, User } from 'lucide-react';
import { StatusHistorico, STATUS_LABELS, STATUS_COLORS, StatusOS } from '../types/ordem-servico.types';

interface StatusTimelineProps {
    ordemId: string;
    onLoad?: (historico: StatusHistorico[]) => void;
}

import api from '@/lib/api';

function formatRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Agora mesmo';
    if (diffMins < 60) return `Há ${diffMins} minuto${diffMins > 1 ? 's' : ''}`;
    if (diffHours < 24) return `Há ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
    if (diffDays < 7) return `Há ${diffDays} dia${diffDays > 1 ? 's' : ''}`;

    return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function getStatusColor(status: number): string {
    return STATUS_COLORS[status as StatusOS] || 'bg-gray-500';
}

function getStatusLabel(status: number): string {
    return STATUS_LABELS[status as StatusOS] || 'Desconhecido';
}

export function StatusTimeline({ ordemId, onLoad }: StatusTimelineProps) {
    const [historico, setHistorico] = useState<StatusHistorico[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!ordemId) return;

        const fetchHistorico = async () => {
            try {
                setLoading(true);
                setError(null);
                const response = await api.get(`/api/ordem_servico/ordens/${ordemId}/status-historico`);
                const data = Array.isArray(response.data) ? response.data : [];
                setHistorico(data);
                onLoad?.(data);
            } catch (err) {
                console.error('Erro ao carregar histórico de status:', err);
                setError('Erro ao carregar histórico');
            } finally {
                setLoading(false);
            }
        };

        fetchHistorico();
    }, [ordemId, onLoad]);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                <span className="ml-2 text-sm text-muted-foreground">Carregando histórico...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-4 text-sm text-destructive">
                {error}
            </div>
        );
    }

    if (historico.length === 0) {
        return (
            <div className="text-center py-4 text-sm text-muted-foreground">
                Nenhuma mudança de status registrada.
            </div>
        );
    }

    return (
        <div className="relative">
            {/* Linha vertical (agora mais discreta) */}
            <div className="absolute left-2.5 top-2 bottom-2 w-px bg-border/50" />

            <div className="space-y-3">
                {historico.map((item, index) => (
                    <div key={item.id} className="relative pl-8 group">
                        {/* Ponto na timeline */}
                        <div className={`absolute left-1.5 top-1.5 w-2.5 h-2.5 rounded-full ${getStatusColor(item.status_novo)} ring-2 ring-background`} />

                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-sm gap-1">
                            {/* Info Principal Linha Única */}
                            <div className="flex flex-wrap items-center gap-x-2 text-muted-foreground">
                                <div className="flex items-center gap-1 font-medium text-foreground">
                                    <User className="h-3.5 w-3.5" />
                                    <span>{item.usuario_nome || 'Sistema'}</span>
                                </div>

                                <span className="text-muted-foreground/40 hidden sm:inline">•</span>

                                <div className="flex items-center gap-1.5">
                                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium text-white ${getStatusColor(item.status_anterior)}`}>
                                        {getStatusLabel(item.status_anterior)}
                                    </span>
                                    <ArrowRight className="h-3 w-3 text-muted-foreground/60" />
                                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium text-white ${getStatusColor(item.status_novo)}`}>
                                        {getStatusLabel(item.status_novo)}
                                    </span>
                                </div>
                            </div>

                            {/* Data */}
                            <div className="text-xs text-muted-foreground/70 whitespace-nowrap">
                                {formatRelativeTime(item.data_alteracao)}
                            </div>
                        </div>

                        {/* Observações (se houver, logo abaixo) */}
                        {item.observacoes && (
                            <p className="mt-1 text-xs text-muted-foreground bg-muted/30 rounded px-2 py-1 border border-border/50 inline-block">
                                {item.observacoes}
                            </p>
                        )}
                    </div>
                ))}
            </div>
        </div>

    );
}
