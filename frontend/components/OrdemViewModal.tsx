'use client';

import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Calendar,
    User,
    Smartphone,
    Monitor,
    CreditCard,
    FileText,
    AlertCircle,
    Clock,
    CheckCircle2,
    XCircle,
    Wrench,
    Search,
    Package,
    Eye,
    Printer,
    Receipt
} from 'lucide-react';
import { OrdemServico, StatusOS, STATUS_LABELS, STATUS_COLORS } from '../types/ordem-servico.types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface OrdemViewModalProps {
    isOpen: boolean;
    onClose: () => void;
    ordem: OrdemServico | null;
    onPrintA4?: (ordem: OrdemServico) => void;
    onPrintThermal?: (ordem: OrdemServico) => void;
}

export const OrdemViewModal: React.FC<OrdemViewModalProps> = ({ isOpen, onClose, ordem, onPrintA4, onPrintThermal }) => {
    if (!ordem) return null;

    const formatDate = (dateString?: string) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('pt-BR');
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };

    const getStatusBadge = (status: StatusOS) => {
        return (
            <Badge className={`${STATUS_COLORS[status]} text-white`}>
                {STATUS_LABELS[status]}
            </Badge>
        );
    };

    const getPrioridadeBadge = (prioridade: string) => {
        const colors: any = {
            BAIXA: 'bg-skin-success/10 text-skin-success border-skin-success',
            MEDIA: 'bg-skin-warning/10 text-skin-warning border-skin-warning',
            ALTA: 'bg-skin-danger/10 text-skin-danger border-skin-danger'
        };
        return (
            <Badge variant="outline" className={colors[prioridade] || ''}>
                {prioridade}
            </Badge>
        );
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
                <DialogHeader className="p-6 pb-2 sticky top-0 bg-skin-background z-10 border-b">
                    <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                <FileText className="h-6 w-6" />
                            </div>
                            <div>
                                <DialogTitle className="text-xl">OS #{ordem.numero}</DialogTitle>
                                <DialogDescription className="sr-only">
                                    Visualização detalhada da ordem de serviço.
                                </DialogDescription>
                                <div className="flex items-center gap-2 mt-1">
                                    {getStatusBadge(ordem.status)}
                                    {getPrioridadeBadge(ordem.prioridade)}
                                </div>
                            </div>
                        </div>
                        <div className="text-right text-sm text-skin-text-muted">
                            <div className="flex items-center gap-1 justify-end">
                                <Calendar className="h-4 w-4" />
                                <span>Abertura: {formatDate(ordem.data_abertura)}</span>
                            </div>
                            {ordem.data_previsao && (
                                <div className="flex items-center gap-1 justify-end mt-1 font-medium text-skin-warning">
                                    <Clock className="h-4 w-4" />
                                    <span>Previsão: {formatDate(ordem.data_previsao)}</span>
                                </div>
                            )}
                        </div>
                        <div className="flex items-center gap-2 pr-12">
                            {onPrintA4 && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => onPrintA4(ordem)}
                                    className="h-8 gap-1 hidden md:flex"
                                >
                                    <Printer className="h-3.5 w-3.5" />
                                    <span className="text-xs">A4</span>
                                </Button>
                            )}
                            {onPrintThermal && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => onPrintThermal(ordem)}
                                    className="h-8 gap-1 hidden md:flex"
                                >
                                    <Receipt className="h-3.5 w-3.5" />
                                    <span className="text-xs">80mm</span>
                                </Button>
                            )}
                        </div>
                    </div>
                </DialogHeader>

                <div className="p-6 space-y-6">
                    {/* Grid Principal */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Cliente Info */}
                        <Card className="border-none shadow-none bg-muted/30">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-semibold uppercase flex items-center gap-2 text-skin-text-muted">
                                    <User className="h-4 w-4" />
                                    Dados do Cliente
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div>
                                    <div className="text-sm font-bold">{ordem.cliente?.name}</div>
                                    {ordem.cliente?.document && (
                                        <div className="text-xs text-skin-text-muted">{ordem.cliente.document}</div>
                                    )}
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div>
                                        <span className="text-xs text-skin-text-muted block">Telefone</span>
                                        <span>{ordem.cliente?.phone_primary}</span>
                                    </div>
                                    {ordem.cliente?.phone_secondary && (
                                        <div>
                                            <span className="text-xs text-skin-text-muted block">Tel. Secundário</span>
                                            <span className="truncate block">{ordem.cliente.phone_secondary}</span>
                                        </div>
                                    )}
                                </div>
                                {ordem.cliente?.address_street && (
                                    <div>
                                        <span className="text-xs text-skin-text-muted block">Endereço</span>
                                        <span className="text-xs">
                                            {ordem.cliente.address_street}, {ordem.cliente.address_number}
                                            {ordem.cliente.address_neighborhood && ` - ${ordem.cliente.address_neighborhood}`}
                                            {ordem.cliente.address_city && ` - ${ordem.cliente.address_city}/${ordem.cliente.address_state}`}
                                        </span>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Equipamento Info */}
                        <Card className="border-none shadow-none bg-muted/30">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-semibold uppercase flex items-center gap-2 text-skin-text-muted">
                                    <Monitor className="h-4 w-4" />
                                    Equipamento
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="text-xs text-skin-text-muted block">Tipo</span>
                                        <span className="font-medium">{ordem.equipamento_tipo || '-'}</span>
                                    </div>
                                    <div>
                                        <span className="text-xs text-skin-text-muted block">Marca/Modelo</span>
                                        <span className="font-medium">{ordem.equipamento_marca} {ordem.equipamento_modelo}</span>
                                    </div>
                                    <div>
                                        <span className="text-xs text-skin-text-muted block">Número de Série</span>
                                        <span>{ordem.equipamento_serie || '-'}</span>
                                    </div>
                                    <div>
                                        <span className="text-xs text-skin-text-muted block">Responsável</span>
                                        <span>{ordem.usuario_responsavel?.name || 'Não atribuído'}</span>
                                    </div>
                                </div>

                                {(ordem.equipamento_acessorios || ordem.equipamento_estado) && (
                                    <div className="flex flex-wrap gap-x-6 gap-y-3 pt-2 border-t border-muted/50">
                                        {ordem.equipamento_acessorios && (
                                            <div className="flex-shrink-0 max-w-[45%]">
                                                <span className="text-xs text-skin-text-muted block">Acessórios / Outros</span>
                                                <span className="text-xs">{ordem.equipamento_acessorios}</span>
                                            </div>
                                        )}
                                        {ordem.equipamento_estado && (
                                            <div className="flex-shrink-0 max-w-[45%]">
                                                <span className="text-xs text-skin-text-muted block">Estado de Entrega / Obs</span>
                                                <span className="text-xs">{ordem.equipamento_estado}</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Detalhes do Serviço */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-sm font-semibold uppercase text-skin-text-muted">
                            <Wrench className="h-4 w-4" />
                            Descrição do Serviço
                        </div>
                        <div className="bg-muted/30 rounded-lg p-4 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-b pb-4 border-muted">
                                <div>
                                    <span className="text-xs text-skin-text-muted block">Tipo de Serviço</span>
                                    <span className="font-medium">{ordem.tipo_servico}</span>
                                </div>
                                {ordem.formatacao_so && (
                                    <div>
                                        <span className="text-xs text-skin-text-muted block">Sistema Operacional</span>
                                        <span className="font-medium">{ordem.formatacao_so}</span>
                                    </div>
                                )}
                                {ordem.formatacao_senha && (
                                    <div>
                                        <span className="text-xs text-skin-text-muted block">Senha</span>
                                        <span className="font-medium">{ordem.formatacao_senha}</span>
                                    </div>
                                )}
                                {ordem.formatacao_backup !== undefined && (
                                    <div className="md:col-span-2 flex flex-col gap-1">
                                        <span className="text-xs text-skin-text-muted block font-bold uppercase text-[10px]">Backup</span>
                                        <div className="flex items-start gap-2">
                                            <Badge variant={ordem.formatacao_backup ? 'default' : 'secondary'} className="h-5 shrink-0">
                                                {ordem.formatacao_backup ? 'Sim' : 'Não'}
                                            </Badge>
                                            {ordem.formatacao_backup && ordem.formatacao_backup_descricao && (
                                                <div className="text-xs bg-primary/5 border border-primary/20 rounded p-1.5 flex-1 italic">
                                                    <span className="font-bold block text-[9px] uppercase text-primary mb-0.5">O que salvar:</span>
                                                    {ordem.formatacao_backup_descricao}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div>
                                <span className="text-xs text-skin-text-muted block mb-1 font-semibold uppercase">Defeito/Solicitação</span>
                                <div
                                    className="text-sm prose prose-sm max-w-none"
                                    dangerouslySetInnerHTML={{ __html: ordem.descricao }}
                                />
                            </div>

                            {ordem.laudo_tecnico && (
                                <div>
                                    <Separator className="my-4" />
                                    <span className="text-xs text-skin-text-muted block mb-1 font-semibold uppercase">Laudo Técnico</span>
                                    <div
                                        className="text-sm prose prose-sm max-w-none bg-skin-info/10/50 p-3 rounded"
                                        dangerouslySetInnerHTML={{ __html: ordem.laudo_tecnico }}
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Produtos e Serviços (Itens) */}
                    {ordem.itens && ordem.itens.length > 0 && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-sm font-semibold uppercase text-skin-text-muted">
                                <Package className="h-4 w-4" />
                                Produtos e Serviços
                            </div>
                            <div className="border rounded-lg overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead className="bg-muted/50">
                                        <tr>
                                            <th className="px-4 py-2 text-left font-medium">Descrição</th>
                                            <th className="px-4 py-2 text-center font-medium w-20">Qtd</th>
                                            <th className="px-4 py-2 text-right font-medium w-32">Unitário</th>
                                            <th className="px-4 py-2 text-right font-medium w-32">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {ordem.itens.map((item: any, index: number) => (
                                            <tr key={index}>
                                                <td className="px-4 py-2">{item.descricao}</td>
                                                <td className="px-4 py-2 text-center">{item.quantidade}</td>
                                                <td className="px-4 py-2 text-right">{formatCurrency(item.valor_unitario)}</td>
                                                <td className="px-4 py-2 text-right font-medium">{formatCurrency(item.valor_total)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot className="bg-muted/20 font-bold">
                                        <tr>
                                            <td colSpan={3} className="px-4 py-3 text-right text-skin-text-muted">VALOR TOTAL DA OS:</td>
                                            <td className="px-4 py-3 text-right text-primary text-lg">
                                                {formatCurrency(ordem.valor_servico)}
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Observações */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
                        {/* Observações do Cliente */}
                        {ordem.observacoes_cliente && (
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-sm font-semibold uppercase text-skin-text-muted">
                                    <AlertCircle className="h-4 w-4" />
                                    Observações do Cliente
                                </div>
                                <div
                                    className="bg-skin-warning/10/50 border border-skin-warning rounded-lg p-3 text-sm text-skin-warning-hover italic prose prose-sm max-w-none"
                                    dangerouslySetInnerHTML={{ __html: ordem.observacoes_cliente }}
                                />
                            </div>
                        )}

                        {/* Observações Internas */}
                        {ordem.observacoes_internas && (
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-sm font-semibold uppercase text-skin-text-muted">
                                    <Search className="h-4 w-4" />
                                    Observações Internas (Uso Técnico)
                                </div>
                                <div
                                    className="bg-skin-info/10/50 border border-skin-info rounded-lg p-3 text-sm text-skin-info-hover italic prose prose-sm max-w-none"
                                    dangerouslySetInnerHTML={{ __html: ordem.observacoes_internas }}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
