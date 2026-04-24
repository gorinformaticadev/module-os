'use client';

import React, { useEffect, useState } from 'react';
import { History, MessageCircle, Send, User } from 'lucide-react';
import api from '@/lib/api';
import { WhatsAppEnvioHistorico } from '../types/ordem-servico.types';

interface WhatsAppHistoryProps {
    ordemId: string;
    refreshKey?: number;
    compact?: boolean;
}

const METHOD_LABELS: Record<string, string> = {
    api: 'App Desktop (API)',
    web: 'WhatsApp Web',
    crm: 'CRM',
};

function formatDateTime(dateString: string): string {
    if (!dateString) return '';
    return new Date(dateString).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export function WhatsAppHistory({ ordemId, refreshKey = 0, compact = false }: WhatsAppHistoryProps) {
    const [historico, setHistorico] = useState<WhatsAppEnvioHistorico[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!ordemId) return;

        const fetchHistorico = async () => {
            try {
                setLoading(true);
                setError(null);
                const response = await api.get(`/api/ordem_servico/ordens/${ordemId}/whatsapp-envios`);
                setHistorico(Array.isArray(response.data) ? response.data : []);
            } catch (err) {
                console.error('Erro ao carregar historico de WhatsApp:', err);
                setError('Erro ao carregar historico de WhatsApp');
            } finally {
                setLoading(false);
            }
        };

        fetchHistorico();
    }, [ordemId, refreshKey]);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary mr-2" />
                Carregando historico...
            </div>
        );
    }

    if (error) {
        return <div className="text-center py-4 text-sm text-destructive">{error}</div>;
    }

    if (historico.length === 0) {
        return (
            <div className="text-center py-6 text-sm text-muted-foreground">
                <MessageCircle className="h-8 w-8 mx-auto mb-2 text-muted-foreground/60" />
                Nenhum envio de WhatsApp registrado.
            </div>
        );
    }

    return (
        <div className={compact ? 'max-h-64 overflow-y-auto pr-1' : ''}>
            <div className="space-y-3">
                {historico.map((item) => (
                    <div key={item.id} className="rounded-md border bg-card p-3">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                            <div className="space-y-1">
                                <div className="flex flex-wrap items-center gap-2 text-sm">
                                    <span className="inline-flex items-center gap-1 font-medium">
                                        <User className="h-3.5 w-3.5" />
                                        {item.usuario_nome || 'Sistema'}
                                    </span>
                                    <span className="inline-flex items-center gap-1 rounded bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700 border border-green-100">
                                        <Send className="h-3 w-3" />
                                        {METHOD_LABELS[item.forma_envio] || item.forma_envio}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <History className="h-3.5 w-3.5" />
                                    {formatDateTime(item.created_at)}
                                </div>
                            </div>
                        </div>
                        <p className="mt-3 whitespace-pre-wrap rounded bg-muted/30 border px-3 py-2 text-sm text-muted-foreground">
                            {item.mensagem}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
}
