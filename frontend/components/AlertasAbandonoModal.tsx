'use client';

import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { 
    AlertTriangle, 
    Bell,
    CheckCircle,
    Circle,
    Loader2,
    MessageSquare,
    Phone,
    Mail,
    FileText,
    ChevronDown,
    ChevronUp
} from 'lucide-react';
import { 
    AlertaAbandono, 
    MeioComunicacao, 
    MEIO_COMUNICACAO_LABELS
} from '../types/ordem-servico.types';

interface AlertasAbandonoModalProps {
    isOpen: boolean;
    onClose: () => void;
    ordemId: string;
    ordemNumero: string;
    onSuccess?: () => void;
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
    },
    post: async (url: string, data: any) => {
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
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `HTTP ${response.status}`);
        }
        return { data: await response.json() };
    }
};

function getMeioIcon(meio: MeioComunicacao) {
    switch (meio) {
        case MeioComunicacao.WHATSAPP:
            return <MessageSquare className="h-4 w-4" />;
        case MeioComunicacao.TELEFONE:
            return <Phone className="h-4 w-4" />;
        case MeioComunicacao.EMAIL:
            return <Mail className="h-4 w-4" />;
        case MeioComunicacao.CARTA:
        case MeioComunicacao.SMS:
            return <FileText className="h-4 w-4" />;
        default:
            return <Bell className="h-4 w-4" />;
    }
}

function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

export function AlertasAbandonoModal({ isOpen, onClose, ordemId, ordemNumero, onSuccess }: AlertasAbandonoModalProps) {
    const [alertas, setAlertas] = useState<AlertaAbandono[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [confirmAbandono, setConfirmAbandono] = useState(false);
    const [expandedAlerta, setExpandedAlerta] = useState<string | null>(null);
    
    // Form para novo alerta
    const [novoAlerta, setNovoAlerta] = useState({
        meio_comunicacao: MeioComunicacao.WHATSAPP,
        data_envio: new Date().toISOString().slice(0, 16),
        mensagem: '',
        observacoes: ''
    });

    useEffect(() => {
        if (isOpen && ordemId) {
            fetchAlertas();
            setConfirmAbandono(false);
            setError(null);
            setExpandedAlerta(null);
        }
    }, [isOpen, ordemId]);

    const fetchAlertas = async () => {
        if (!ordemId) return;
        
        try {
            setLoading(true);
            const response = await api.get(`/api/ordem_servico/ordens/${ordemId}/alertas-abandono`);
            setAlertas(Array.isArray(response.data) ? response.data : []);
        } catch (err) {
            console.error('Erro ao buscar alertas:', err);
            setError('Erro ao carregar alertas');
        } finally {
            setLoading(false);
        }
    };

    const handleRegistrarAlerta = async () => {
        if (!ordemId) return;

        const proximoNumero = alertas.length + 1;
        if (proximoNumero > 3) {
            setError('Já foram registrados 3 alertas');
            return;
        }

        try {
            setSaving(true);
            setError(null);

            await api.post(`/api/ordem_servico/ordens/${ordemId}/alertas-abandono`, {
                numero_alerta: proximoNumero,
                data_envio: novoAlerta.data_envio,
                meio_comunicacao: novoAlerta.meio_comunicacao,
                mensagem: novoAlerta.mensagem || null,
                observacoes: novoAlerta.observacoes || null
            });

            // Resetar form
            setNovoAlerta({
                meio_comunicacao: MeioComunicacao.WHATSAPP,
                data_envio: new Date().toISOString().slice(0, 16),
                mensagem: '',
                observacoes: ''
            });

            // Recarregar alertas
            await fetchAlertas();
        } catch (err: any) {
            console.error('Erro ao registrar alerta:', err);
            setError(err.message || 'Erro ao registrar alerta');
        } finally {
            setSaving(false);
        }
    };

    const handleMarcarAbandonado = async () => {
        if (!ordemId) return;

        try {
            setSaving(true);
            setError(null);

            await api.post(`/api/ordem_servico/ordens/${ordemId}/marcar-abandonado`, {
                observacoes: 'Equipamento marcado como abandonado após 3 tentativas de contato sem sucesso'
            });

            onSuccess?.();
            onClose();
        } catch (err: any) {
            console.error('Erro ao marcar como abandonado:', err);
            setError(err.message || 'Erro ao marcar como abandonado');
        } finally {
            setSaving(false);
        }
    };

    const toggleAlerta = (alertaId: string) => {
        setExpandedAlerta(expandedAlerta === alertaId ? null : alertaId);
    };

    const podeRegistrarAlerta = alertas.length < 3;
    const podeMarcarAbandonado = alertas.length === 3;
    const proximoNumero = alertas.length + 1;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Bell className="h-5 w-5 text-amber-500" />
                        Alertas de Abandono - OS #{ordemNumero}
                    </DialogTitle>
                    <DialogDescription>
                        Registre as tentativas de contato com o cliente antes de marcar como abandonado.
                        São necessárias 3 tentativas.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Progresso */}
                    <div className="flex items-center justify-center gap-4">
                        {[1, 2, 3].map((num) => {
                            const alerta = alertas.find(a => a.numero_alerta === num);
                            const isCompleto = !!alerta;
                            const isProximo = num === proximoNumero && !isCompleto;

                            return (
                                <div key={num} className="flex items-center gap-2">
                                    <div className={`
                                        w-10 h-10 rounded-full flex items-center justify-center
                                        ${isCompleto ? 'bg-green-500 text-white' : isProximo ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}
                                    `}>
                                        {isCompleto ? (
                                            <CheckCircle className="h-5 w-5" />
                                        ) : (
                                            <span className="text-lg font-semibold">{num}</span>
                                        )}
                                    </div>
                                    {num < 3 && (
                                        <div className={`w-8 h-0.5 ${alertas.length >= num ? 'bg-green-500' : 'bg-muted'}`} />
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin" />
                            <span className="ml-2 text-sm text-muted-foreground">Carregando alertas...</span>
                        </div>
                    ) : (
                        <>
                            {/* Lista de Alertas Registrados */}
                            {alertas.length > 0 && (
                                <div className="space-y-2">
                                    {alertas.map((alerta) => {
                                        const alertaId = alerta.id || String(alerta.numero_alerta);
                                        const isExpanded = expandedAlerta === alertaId;
                                        
                                        return (
                                            <div key={alertaId} className="border rounded-lg overflow-hidden">
                                                <button
                                                    type="button"
                                                    onClick={() => toggleAlerta(alertaId)}
                                                    className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                                            <CheckCircle className="h-4 w-4 text-green-600" />
                                                        </div>
                                                        <div className="text-left">
                                                            <div className="font-medium">Alerta {alerta.numero_alerta}</div>
                                                            <div className="text-xs text-muted-foreground">
                                                                {MEIO_COMUNICACAO_LABELS[alerta.meio_comunicacao]} - {formatDate(alerta.data_envio)}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {isExpanded ? (
                                                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                                                    ) : (
                                                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                                    )}
                                                </button>
                                                {isExpanded && (
                                                    <div className="px-3 pb-3 pl-14 space-y-2 text-sm border-t bg-muted/20">
                                                        <div className="flex items-center gap-2 pt-2">
                                                            {getMeioIcon(alerta.meio_comunicacao)}
                                                            <span>{MEIO_COMUNICACAO_LABELS[alerta.meio_comunicacao]}</span>
                                                        </div>
                                                        {alerta.mensagem && (
                                                            <div className="bg-muted/50 rounded p-2">
                                                                <p className="text-xs text-muted-foreground mb-1">Mensagem:</p>
                                                                <p>{alerta.mensagem}</p>
                                                            </div>
                                                        )}
                                                        {alerta.observacoes && (
                                                            <div className="text-muted-foreground">
                                                                <p className="text-xs">Observações: {alerta.observacoes}</p>
                                                            </div>
                                                        )}
                                                        {alerta.enviado_por_nome && (
                                                            <p className="text-xs text-muted-foreground">
                                                                Registrado por: {alerta.enviado_por_nome}
                                                            </p>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Formulário para Novo Alerta */}
                            {podeRegistrarAlerta && (
                                <div className="border rounded-lg p-4 space-y-4">
                                    <h4 className="font-medium flex items-center gap-2">
                                        <Circle className="h-4 w-4 text-primary" />
                                        Registrar Alerta {proximoNumero}
                                    </h4>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label className="text-sm">Meio de Comunicação</Label>
                                            <Select
                                                value={novoAlerta.meio_comunicacao}
                                                onValueChange={(value) => setNovoAlerta({ ...novoAlerta, meio_comunicacao: value as MeioComunicacao })}
                                            >
                                                <SelectTrigger className="mt-1">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {Object.entries(MEIO_COMUNICACAO_LABELS).map(([key, label]) => (
                                                        <SelectItem key={key} value={key}>
                                                            <div className="flex items-center gap-2">
                                                                {getMeioIcon(key as MeioComunicacao)}
                                                                {label}
                                                            </div>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div>
                                            <Label className="text-sm">Data e Hora do Envio</Label>
                                            <Input
                                                type="datetime-local"
                                                value={novoAlerta.data_envio}
                                                onChange={(e) => setNovoAlerta({ ...novoAlerta, data_envio: e.target.value })}
                                                className="mt-1"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <Label className="text-sm">Mensagem Enviada (opcional)</Label>
                                        <Textarea
                                            value={novoAlerta.mensagem}
                                            onChange={(e) => setNovoAlerta({ ...novoAlerta, mensagem: e.target.value })}
                                            placeholder="Conteúdo da mensagem enviada ao cliente..."
                                            className="mt-1"
                                            rows={3}
                                        />
                                    </div>

                                    <div>
                                        <Label className="text-sm">Observações (opcional)</Label>
                                        <Input
                                            value={novoAlerta.observacoes}
                                            onChange={(e) => setNovoAlerta({ ...novoAlerta, observacoes: e.target.value })}
                                            placeholder="Observações sobre o contato..."
                                            className="mt-1"
                                        />
                                    </div>

                                    <Button 
                                        onClick={handleRegistrarAlerta} 
                                        disabled={saving}
                                        className="w-full"
                                    >
                                        {saving ? (
                                            <>
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                Registrando...
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle className="h-4 w-4 mr-2" />
                                                Registrar Alerta {proximoNumero}
                                            </>
                                        )}
                                    </Button>
                                </div>
                            )}

                            {/* Botão de Marcar como Abandonado */}
                            {podeMarcarAbandonado && !confirmAbandono && (
                                <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                                    <div className="flex items-start gap-3">
                                        <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
                                        <div className="flex-1">
                                            <h4 className="font-medium text-amber-700 dark:text-amber-400">
                                                3 alertas registrados
                                            </h4>
                                            <p className="text-sm text-amber-600 dark:text-amber-500 mt-1">
                                                Você pode agora marcar esta OS como abandonada. 
                                                Esta ação é irreversível.
                                            </p>
                                            <Button 
                                                variant="destructive" 
                                                className="mt-3"
                                                onClick={() => setConfirmAbandono(true)}
                                            >
                                                <AlertTriangle className="h-4 w-4 mr-2" />
                                                Marcar como Abandonado
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Confirmação de Abandono */}
                            {confirmAbandono && (
                                <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                                    <div className="flex items-start gap-3">
                                        <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
                                        <div className="flex-1">
                                            <h4 className="font-medium text-red-700 dark:text-red-400">
                                                Confirmar Abandono
                                            </h4>
                                            <p className="text-sm text-red-600 dark:text-red-500 mt-1">
                                                Tem certeza que deseja marcar esta OS como abandonada? 
                                                Esta ação não pode ser desfeita.
                                            </p>
                                            <div className="flex gap-2 mt-3">
                                                <Button 
                                                    variant="outline" 
                                                    onClick={() => setConfirmAbandono(false)}
                                                    disabled={saving}
                                                >
                                                    Cancelar
                                                </Button>
                                                <Button 
                                                    variant="destructive"
                                                    onClick={handleMarcarAbandonado}
                                                    disabled={saving}
                                                >
                                                    {saving ? (
                                                        <>
                                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                            Processando...
                                                        </>
                                                    ) : (
                                                        'Confirmar Abandono'
                                                    )}
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {/* Erro */}
                    {error && (
                        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-sm text-destructive">
                            {error}
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={saving}>
                        Fechar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
