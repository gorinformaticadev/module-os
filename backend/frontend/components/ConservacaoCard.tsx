'use client';

import React, { useState, useEffect } from 'react';
import { AlertTriangle, Clock, DollarSign, Calendar, RefreshCw } from 'lucide-react';
import { ConservacaoCalculo } from '../types/ordem-servico.types';

interface ConservacaoCardProps {
    ordemId: string;
    valorServico: number;
    onConservacaoCalculada?: (conservacao: ConservacaoCalculo) => void;
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

function formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
}

function formatDate(dateString: string | null): string {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

export function ConservacaoCard({ ordemId, valorServico, onConservacaoCalculada }: ConservacaoCardProps) {
    const [conservacao, setConservacao] = useState<ConservacaoCalculo | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchConservacao = async () => {
        if (!ordemId) return;
        
        try {
            setLoading(true);
            setError(null);
            const response = await api.get(`/api/ordem_servico/ordens/${ordemId}/conservacao`);
            setConservacao(response.data);
            onConservacaoCalculada?.(response.data);
        } catch (err) {
            console.error('Erro ao calcular conservação:', err);
            setError('Erro ao calcular conservação');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchConservacao();
    }, [ordemId]);

    if (loading) {
        return (
            <div className="bg-muted/30 rounded-lg border p-4">
                <div className="flex items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                    <span className="ml-2 text-sm text-muted-foreground">Calculando...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-destructive/10 rounded-lg border border-destructive/20 p-4">
                <p className="text-sm text-destructive">{error}</p>
            </div>
        );
    }

    if (!conservacao) return null;

    const totalRetirada = valorServico + (conservacao.emAtraso ? conservacao.valorConservacao : 0);

    return (
        <div className={`rounded-lg border p-4 ${conservacao.emAtraso ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800' : 'bg-muted/30'}`}>
            <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                    {conservacao.emAtraso ? (
                        <>
                            <AlertTriangle className="h-4 w-4 text-amber-500" />
                            <span className="text-amber-700 dark:text-amber-400">Taxa de Conservação</span>
                        </>
                    ) : (
                        <>
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span>Prazo de Retirada</span>
                        </>
                    )}
                </h4>
                <button 
                    onClick={fetchConservacao}
                    className="p-1 hover:bg-muted rounded transition-colors"
                    title="Recalcular"
                >
                    <RefreshCw className="h-4 w-4 text-muted-foreground" />
                </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
                {/* Data Limite */}
                <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                        <p className="text-xs text-muted-foreground">Data Limite</p>
                        <p className="font-medium">{formatDate(conservacao.dataLimite)}</p>
                    </div>
                </div>

                {/* Dias de Atraso */}
                <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                        <p className="text-xs text-muted-foreground">Dias de Atraso</p>
                        <p className={`font-medium ${conservacao.emAtraso ? 'text-amber-600 dark:text-amber-400' : ''}`}>
                            {conservacao.diasAtraso} dia{conservacao.diasAtraso !== 1 ? 's' : ''}
                        </p>
                    </div>
                </div>

                {/* Valor do Serviço */}
                <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <div>
                        <p className="text-xs text-muted-foreground">Valor do Serviço</p>
                        <p className="font-medium">{formatCurrency(valorServico)}</p>
                    </div>
                </div>

                {/* Taxa de Conservação */}
                {conservacao.emAtraso && (
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                        <div>
                            <p className="text-xs text-muted-foreground">Taxa de Conservação</p>
                            <p className="font-medium text-amber-600 dark:text-amber-400">
                                + {formatCurrency(conservacao.valorConservacao)}
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Total */}
            <div className="mt-4 pt-3 border-t border-border">
                <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Total para Retirada</span>
                    <span className={`text-lg font-bold ${conservacao.emAtraso ? 'text-amber-600 dark:text-amber-400' : 'text-primary'}`}>
                        {formatCurrency(totalRetirada)}
                    </span>
                </div>
                {conservacao.emAtraso && (
                    <p className="text-xs text-muted-foreground mt-1">
                        Taxa diária: {formatCurrency(conservacao.valorDiario)} x {conservacao.diasAtraso} dias
                    </p>
                )}
            </div>

            {/* Info sobre configuração */}
            {!conservacao.conservacaoHabilitada && (
                <p className="text-xs text-muted-foreground mt-3 bg-muted/50 rounded p-2">
                    Taxa de conservação está desabilitada nas configurações.
                </p>
            )}
        </div>
    );
}
