'use client';

import React, { useState, useEffect } from 'react';
import { Package, AlertTriangle, Clock } from 'lucide-react';
import Link from 'next/link';
import { AlertaRetirada } from '../types/ordem-servico.types';
import api from '@/lib/api';

interface AlertaRetiradaBadgeProps {
    className?: string;
    showDetails?: boolean;
    refreshInterval?: number; // em milissegundos
    variant?: 'badge' | 'card';
}


export function AlertaRetiradaBadge({ 
    className = '', 
    showDetails = false,
    refreshInterval = 60000, // 1 minuto
    variant
}: AlertaRetiradaBadgeProps) {
    const [alertas, setAlertas] = useState<AlertaRetirada | null>(null);
    const [loading, setLoading] = useState(true);
    const renderDetails = variant ? variant === 'card' : showDetails;

    const fetchAlertas = async () => {
        try {
            const response = await api.get('/api/ordem_servico/ordens/alertas-retirada');
            setAlertas(response.data);
        } catch (err) {
            console.error('Erro ao buscar alertas de retirada:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAlertas();
        
        // Polling
        const interval = setInterval(fetchAlertas, refreshInterval);
        return () => clearInterval(interval);
    }, [refreshInterval]);

    if (loading || !alertas || alertas.total_pendentes === 0) {
        return null;
    }

    const getBadgeColor = () => {
        if (alertas.urgentes > 0) return 'bg-skin-danger';
        if (alertas.atencao > 0) return 'bg-skin-warning';
        return 'bg-skin-info';
    };

    const getBadgeIcon = () => {
        if (alertas.urgentes > 0) return <AlertTriangle className="h-3 w-3" />;
        if (alertas.atencao > 0) return <Clock className="h-3 w-3" />;
        return <Package className="h-3 w-3" />;
    };

    // Versão simples (apenas badge)
    if (!renderDetails) {
        return (
            <Link 
                href="/modules/ordem_servico/pages/ordens?status=6"
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-white ${getBadgeColor()} hover:opacity-90 transition-opacity ${className}`}
                title={`${alertas.total_pendentes} equipamento(s) aguardando retirada`}
            >
                {getBadgeIcon()}
                <span>{alertas.total_pendentes}</span>
            </Link>
        );
    }

    // Versão com detalhes (para dashboard)
    return (
        <div className={`rounded-lg border p-4 ${className}`}>
            <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Equipamentos Aguardando Retirada
                </h4>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-white ${getBadgeColor()}`}>
                    {alertas.total_pendentes}
                </span>
            </div>

            <div className="space-y-2">
                {/* Urgentes */}
                {alertas.urgentes > 0 && (
                    <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-skin-danger" />
                            <span className="text-skin-text-muted">Urgentes (&gt;30 dias)</span>
                        </div>
                        <span className="font-medium text-skin-danger dark:text-skin-danger">{alertas.urgentes}</span>
                    </div>
                )}

                {/* Atenção */}
                {alertas.atencao > 0 && (
                    <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-skin-warning" />
                            <span className="text-skin-text-muted">Atenção (15-30 dias)</span>
                        </div>
                        <span className="font-medium text-skin-warning dark:text-skin-warning">{alertas.atencao}</span>
                    </div>
                )}

                {/* Normal */}
                {alertas.normal > 0 && (
                    <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-skin-info" />
                            <span className="text-skin-text-muted">Normal (&lt;15 dias)</span>
                        </div>
                        <span className="font-medium text-skin-info dark:text-skin-info">{alertas.normal}</span>
                    </div>
                )}

                {/* Cobrança Ativa */}
                {alertas.cobranca_ativa > 0 && (
                    <div className="flex items-center justify-between text-sm pt-2 border-t">
                        <div className="flex items-center gap-2">
                            <AlertTriangle className="h-3 w-3 text-skin-warning" />
                            <span className="text-skin-text-muted">Com taxa de conservação</span>
                        </div>
                        <span className="font-medium text-skin-warning dark:text-skin-warning">{alertas.cobranca_ativa}</span>
                    </div>
                )}
            </div>

            <Link 
                href="/modules/ordem_servico/pages/ordens?status=6"
                className="block w-full mt-4 text-center text-sm text-primary hover:underline"
            >
                Ver todos
            </Link>
        </div>
    );
}
