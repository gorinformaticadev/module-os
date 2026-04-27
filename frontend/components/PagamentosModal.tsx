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
    Plus, 
    Trash2, 
    DollarSign, 
    CreditCard, 
    AlertTriangle,
    CheckCircle,
    Loader2
} from 'lucide-react';
import { 
    OrdemServico, 
    Pagamento, 
    FormaPagamento, 
    FORMA_PAGAMENTO_LABELS,
    ConservacaoCalculo
} from '../types/ordem-servico.types';

interface PagamentosModalProps {
    isOpen: boolean;
    onClose: () => void;
    ordem: Pick<OrdemServico, 'id' | 'numero' | 'valor_servico'> | null;
    onSuccess?: () => void;
}

import api from '@/lib/api';

function formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
}

export function PagamentosModal({ isOpen, onClose, ordem, onSuccess }: PagamentosModalProps) {
    const [pagamentos, setPagamentos] = useState<Pagamento[]>([
        { forma_pagamento: FormaPagamento.PIX, valor: 0 }
    ]);
    const [conservacao, setConservacao] = useState<ConservacaoCalculo | null>(null);
    const [observacoes, setObservacoes] = useState('');
    const [loading, setLoading] = useState(false);
    const [loadingConservacao, setLoadingConservacao] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Calcular valores
    const valorServico = ordem?.valor_servico || 0;
    const valorConservacao = conservacao?.emAtraso ? conservacao.valorConservacao : 0;
    const totalOS = valorServico + valorConservacao;
    const totalPagamentos = pagamentos.reduce((sum, p) => sum + (p.valor || 0), 0);
    const diferenca = Math.abs(totalPagamentos - totalOS);
    const somaCorreta = diferenca < 0.01;

    useEffect(() => {
        if (isOpen && ordem) {
            // Resetar estado
            setPagamentos([{ forma_pagamento: FormaPagamento.PIX, valor: ordem.valor_servico || 0 }]);
            setObservacoes('');
            setError(null);
            
            // Buscar conservação
            fetchConservacao();
        }
    }, [isOpen, ordem]);

    const fetchConservacao = async () => {
        if (!ordem) return;
        
        try {
            setLoadingConservacao(true);
            const response = await api.get(`/api/ordem_servico/ordens/${ordem.id}/conservacao`);
            setConservacao(response.data);
            
            // Atualizar valor do primeiro pagamento para incluir conservação
            if (response.data.emAtraso) {
                const novoTotal = (ordem.valor_servico || 0) + response.data.valorConservacao;
                setPagamentos([{ forma_pagamento: FormaPagamento.PIX, valor: novoTotal }]);
            }
        } catch (err) {
            console.error('Erro ao buscar conservação:', err);
        } finally {
            setLoadingConservacao(false);
        }
    };

    const handleAddPagamento = () => {
        if (pagamentos.length >= 5) {
            setError('Máximo de 5 formas de pagamento');
            return;
        }
        setPagamentos([...pagamentos, { forma_pagamento: FormaPagamento.PIX, valor: 0 }]);
    };

    const handleRemovePagamento = (index: number) => {
        if (pagamentos.length === 1) {
            setError('Deve haver pelo menos uma forma de pagamento');
            return;
        }
        setPagamentos(pagamentos.filter((_, i) => i !== index));
    };

    const handlePagamentoChange = (index: number, field: keyof Pagamento, value: any) => {
        const newPagamentos = [...pagamentos];
        newPagamentos[index] = { ...newPagamentos[index], [field]: value };
        setPagamentos(newPagamentos);
        setError(null);
    };

    const handleDistribuirIgualmente = () => {
        const valorPorPagamento = totalOS / pagamentos.length;
        setPagamentos(pagamentos.map(p => ({ ...p, valor: Math.round(valorPorPagamento * 100) / 100 })));
    };

    const handleSubmit = async () => {
        if (!ordem) return;

        // Validações
        if (pagamentos.length === 0) {
            setError('Adicione pelo menos uma forma de pagamento');
            return;
        }

        if (!somaCorreta) {
            setError(`A soma dos pagamentos deve ser igual ao total da OS (${formatCurrency(totalOS)})`);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            await api.post(`/api/ordem_servico/ordens/${ordem.id}/retirada`, {
                pagamentos: pagamentos.map(p => ({
                    forma_pagamento: p.forma_pagamento,
                    valor: p.valor,
                    parcelas: p.parcelas || 1,
                    observacoes: p.observacoes
                })),
                observacoes,
                valor_conservacao: valorConservacao
            });

            onSuccess?.();
            onClose();
        } catch (err: any) {
            console.error('Erro ao registrar retirada:', err);
            setError(err.message || 'Erro ao registrar retirada');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5 text-primary" />
                        Registrar Retirada - OS #{ordem?.numero}
                    </DialogTitle>
                    <DialogDescription>
                        Registre as formas de pagamento para finalizar a retirada do equipamento.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Resumo de Valores */}
                    <div className="bg-muted/30 rounded-lg p-4 space-y-2">
                        <div className="flex justify-between text-sm">
                            <span>Valor do Serviço</span>
                            <span className="font-medium">{formatCurrency(valorServico)}</span>
                        </div>
                        
                        {loadingConservacao ? (
                            <div className="flex items-center gap-2 text-sm text-skin-text-muted">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Calculando conservação...
                            </div>
                        ) : conservacao?.emAtraso && (
                            <div className="flex justify-between text-sm text-skin-warning dark:text-skin-warning">
                                <span className="flex items-center gap-1">
                                    <AlertTriangle className="h-3 w-3" />
                                    Taxa de Conservação ({conservacao.diasAtraso} dias)
                                </span>
                                <span className="font-medium">+ {formatCurrency(valorConservacao)}</span>
                            </div>
                        )}
                        
                        <div className="flex justify-between text-base font-semibold border-t pt-2">
                            <span>Total a Receber</span>
                            <span className="text-primary">{formatCurrency(totalOS)}</span>
                        </div>
                    </div>

                    {/* Formas de Pagamento */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Label className="text-sm font-semibold">Formas de Pagamento</Label>
                            <div className="flex gap-2">
                                <Button 
                                    type="button" 
                                    variant="outline" 
                                    size="sm"
                                    onClick={handleDistribuirIgualmente}
                                    disabled={pagamentos.length < 2}
                                >
                                    Distribuir Igual
                                </Button>
                                <Button 
                                    type="button" 
                                    variant="outline" 
                                    size="sm"
                                    onClick={handleAddPagamento}
                                    disabled={pagamentos.length >= 5}
                                >
                                    <Plus className="h-4 w-4 mr-1" />
                                    Adicionar
                                </Button>
                            </div>
                        </div>

                        {pagamentos.map((pagamento, index) => (
                            <div key={index} className="flex gap-3 items-start p-3 bg-card rounded-lg border">
                                <div className="flex-1 grid grid-cols-2 gap-3">
                                    <div>
                                        <Label className="text-xs text-skin-text-muted">Forma</Label>
                                        <Select
                                            value={pagamento.forma_pagamento}
                                            onValueChange={(value) => handlePagamentoChange(index, 'forma_pagamento', value)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {Object.entries(FORMA_PAGAMENTO_LABELS).map(([key, label]) => (
                                                    <SelectItem key={key} value={key}>{label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    
                                    <div>
                                        <Label className="text-xs text-skin-text-muted">Valor</Label>
                                        <div className="relative">
                                            <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-skin-text-muted" />
                                            <Input
                                                type="number"
                                                step="0.01"
                                                min="0.01"
                                                value={pagamento.valor || ''}
                                                onChange={(e) => handlePagamentoChange(index, 'valor', parseFloat(e.target.value) || 0)}
                                                className="pl-8"
                                                placeholder="0,00"
                                            />
                                        </div>
                                    </div>

                                    {pagamento.forma_pagamento === FormaPagamento.CARTAO_CREDITO && (
                                        <div className="col-span-2">
                                            <Label className="text-xs text-skin-text-muted">Parcelas</Label>
                                            <Select
                                                value={String(pagamento.parcelas || 1)}
                                                onValueChange={(value) => handlePagamentoChange(index, 'parcelas', parseInt(value))}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => (
                                                        <SelectItem key={n} value={String(n)}>{n}x</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}
                                </div>
                                
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleRemovePagamento(index)}
                                    disabled={pagamentos.length === 1}
                                    className="mt-5"
                                >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                            </div>
                        ))}

                        {/* Soma dos pagamentos */}
                        <div className={`flex justify-between items-center p-3 rounded-lg ${somaCorreta ? 'bg-skin-success/10 dark:bg-skin-success-hover/20 border-skin-success dark:border-skin-success' : 'bg-skin-danger/10 dark:bg-skin-danger-hover/20 border-skin-danger dark:border-skin-danger'} border`}>
                            <span className="text-sm font-medium flex items-center gap-2">
                                {somaCorreta ? (
                                    <CheckCircle className="h-4 w-4 text-skin-success" />
                                ) : (
                                    <AlertTriangle className="h-4 w-4 text-skin-danger" />
                                )}
                                Soma dos Pagamentos
                            </span>
                            <span className={`font-semibold ${somaCorreta ? 'text-skin-success dark:text-skin-success' : 'text-skin-danger dark:text-skin-danger'}`}>
                                {formatCurrency(totalPagamentos)}
                            </span>
                        </div>
                    </div>

                    {/* Observações */}
                    <div>
                        <Label className="text-sm">Observações (opcional)</Label>
                        <Textarea
                            value={observacoes}
                            onChange={(e) => setObservacoes(e.target.value)}
                            placeholder="Observações sobre a retirada..."
                            className="mt-1"
                            rows={2}
                        />
                    </div>

                    {/* Erro */}
                    {error && (
                        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-sm text-destructive">
                            {error}
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={loading}>
                        Cancelar
                    </Button>
                    <Button 
                        onClick={handleSubmit} 
                        disabled={loading || !somaCorreta}
                        className="gap-2"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Processando...
                            </>
                        ) : (
                            <>
                                <CheckCircle className="h-4 w-4" />
                                Confirmar Retirada
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
