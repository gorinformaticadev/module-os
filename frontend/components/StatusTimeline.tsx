'use client';

import React, { useState, useEffect } from 'react';
import { Clock, ArrowRight, User } from 'lucide-react';
import { StatusHistorico, STATUS_LABELS, STATUS_COLORS, StatusOS } from '../types/ordem-servico.types';

interface StatusTimelineProps {
    ordemId: string;
    onLoad?: (historico: StatusHistorico[]) => void;
}

// Cliente API
const api = {
    get: async (url: string) => {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
        const getToken = () => {
            if (typeof window === 'undefined') return '';
            const cookies = document.cookie.split(';');
            const tokenCookie = cookies.find(c => c.trim().startsWith('accessToken='));
            if (tokenCookie) return tokenCookie.split('=')[1];
            const encrypted = sessionStorage.getItem("@App:token");
            if (encrypted) { try { return atob(encrypted); } catch { return ''; } }
            return '';
        };
        const token = getToken();
        const response = await fetch(`${baseUrl}${url}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return { data: await response.json() };
    }
};

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
        <div className="space-y-4">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Histórico de Status
            </h4>
            
            <div className="relative">
                {/* Linha vertical */}
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
                
                <div className="space-y-4">
                    {historico.map((item, index) => (
                        <div key={item.id} className="relative pl-10">
                            {/* Ponto na timeline */}
                            <div className={`absolute left-2 w-4 h-4 rounded-full border-2 border-background ${getStatusColor(item.status_novo)}`} />
                            
                            <div className="bg-card rounded-lg border p-3 shadow-sm">
                                {/* Transição de status */}
                                <div className="flex items-center gap-2 mb-2">
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium text-white ${getStatusColor(item.status_anterior)}`}>
                                        {getStatusLabel(item.status_anterior)}
                                    </span>
                                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium text-white ${getStatusColor(item.status_novo)}`}>
                                        {getStatusLabel(item.status_novo)}
                                    </span>
                                </div>
                                
                                {/* Usuário e data */}
                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                    <div className="flex items-center gap-1">
                                        <User className="h-3 w-3" />
                                        <span>{item.usuario_nome || 'Sistema'}</span>
                                    </div>
                                    <span>{formatRelativeTime(item.data_alteracao)}</span>
                                </div>
                                
                                {/* Observações */}
                                {item.observacoes && (
                                    <p className="mt-2 text-xs text-muted-foreground bg-muted/50 rounded p-2">
                                        {item.observacoes}
                                    </p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
