'use client';

import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Calendar,
    User,
    Smartphone,
    Monitor,
    Tool,
    CreditCard,
    FileText,
    AlertCircle,
    Clock,
    CheckCircle2,
    XCircle,
    Wrench,
    Search,
    Package,
    Eye
} from 'lucide-react';
import { OrdemServico, StatusOS, STATUS_LABELS, STATUS_COLORS } from '../types/ordem-servico.types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface OrdemViewModalProps {
    isOpen: boolean;
    onClose: () => void;
    ordem: OrdemServico | null;
}

export const OrdemViewModal: React.FC<OrdemViewModalProps> = ({ isOpen, onClose, ordem }) => {
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
            BAIXA: 'bg-green-100 text-green-700 border-green-200',
            MEDIA: 'bg-yellow-100 text-yellow-700 border-yellow-200',
            ALTA: 'bg-red-100 text-red-700 border-red-200'
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
                <DialogHeader className="p-6 pb-2 sticky top-0 bg-background z-10 border-b">
                    <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                <FileText className="h-6 w-6" />
                            </div>
                            <div>
                                <DialogTitle className="text-xl">OS #{ordem.numero}</DialogTitle>
                                <div className="flex items-center gap-2 mt-1">
                                    {getStatusBadge(ordem.status)}
                                    {getPrioridadeBadge(ordem.prioridade)}
                                </div>
                            </div>
                        </div>
                        <div className="text-right text-sm text-muted-foreground">
                            <div className="flex items-center gap-1 justify-end">
                                <Calendar className="h-4 w-4" />
                                <span>Abertura: {formatDate(ordem.data_abertura)}</span>
                            </div>
                            {ordem.data_previsao && (
                                <div className="flex items-center gap-1 justify-end mt-1 font-medium text-orange-600">
                                    <Clock className="h-4 w-4" />
                                    <span>Previsão: {formatDate(ordem.data_previsao)}</span>
                                </div>
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
                                <CardTitle className="text-sm font-semibold uppercase flex items-center gap-2 text-muted-foreground">
                                    <User className="h-4 w-4" />
                                    Dados do Cliente
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div>
                                    <div className="text-sm font-bold">{ordem.cliente?.name}</div>
                                    {ordem.cliente?.document && (
                                        <div className="text-xs text-muted-foreground">{ordem.cliente.document}</div>
                                    )}
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div>
                                        <span className="text-xs text-muted-foreground block">Telefone</span>
                                        <span>{ordem.cliente?.phone_primary}</span>
                                    </div>
                                    {ordem.cliente?.phone_secondary && (
                                        <div>
                                            <span className="text-xs text-muted-foreground block">Tel. Secundário</span>
                                            <span className="truncate block">{ordem.cliente.phone_secondary}</span>
                                        </div>
                                    )}
                                </div>
                                {ordem.cliente?.address_street && (
                                    <div>
                                        <span className="text-xs text-muted-foreground block">Endereço</span>
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
                                <CardTitle className="text-sm font-semibold uppercase flex items-center gap-2 text-muted-foreground">
                                    <Monitor className="h-4 w-4" />
                                    Equipamento
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="text-xs text-muted-foreground block">Tipo</span>
                                        <span className="font-medium">{ordem.equipamento_tipo || '-'}</span>
                                    </div>
                                    <div>
                                        <span className="text-xs text-muted-foreground block">Marca/Modelo</span>
                                        <span className="font-medium">{ordem.equipamento_marca} {ordem.equipamento_modelo}</span>
                                    </div>
                                    <div>
                                        <span className="text-xs text-muted-foreground block">Série</span>
                                        <span>{ordem.equipamento_serie || '-'}</span>
                                    </div>
                                    <div>
                                        <span className="text-xs text-muted-foreground block">Responsável</span>
                                        <span>{ordem.usuario_responsavel?.name || 'Não atribuído'}</span>
                                    </div>
                                </div>
                                {ordem.equipamento_acessorios && (
                                    <div>
                                        <span className="text-xs text-muted-foreground block">Acessórios</span>
                                        <span className="text-xs">{ordem.equipamento_acessorios}</span>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Detalhes do Serviço */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-sm font-semibold uppercase text-muted-foreground">
                            <Wrench className="h-4 w-4" />
                            Descrição do Serviço
                        </div>
                        <div className="bg-muted/30 rounded-lg p-4 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-b pb-4 border-muted">
                                <div>
                                    <span className="text-xs text-muted-foreground block">Tipo de Serviço</span>
                                    <span className="font-medium">{ordem.tipo_servico}</span>
                                </div>
                                {ordem.formatacao_so && (
                                    <div>
                                        <span className="text-xs text-muted-foreground block">Sistema Operacional</span>
                                        <span className="font-medium">{ordem.formatacao_so}</span>
                                    </div>
                                )}
                                {ordem.formatacao_senha && (
                                    <div>
                                        <span className="text-xs text-muted-foreground block">Senha</span>
                                        <span className="font-medium">{ordem.formatacao_senha}</span>
                                    </div>
                                )}
                                {ordem.formatacao_backup !== undefined && (
                                    <div>
                                        <span className="text-xs text-muted-foreground block">Backup</span>
                                        <Badge variant={ordem.formatacao_backup ? 'default' : 'secondary'} className="h-5">
                                            {ordem.formatacao_backup ? 'Sim' : 'Não'}
                                        </Badge>
                                    </div>
                                )}
                            </div>

                            <div>
                                <span className="text-xs text-muted-foreground block mb-1 font-semibold uppercase">Defeito/Solicitação</span>
                                <div
                                    className="text-sm prose prose-sm max-w-none"
                                    dangerouslySetInnerHTML={{ __html: ordem.descricao }}
                                />
                            </div>

                            {ordem.laudo_tecnico && (
                                <div>
                                    <Separator className="my-4" />
                                    <span className="text-xs text-muted-foreground block mb-1 font-semibold uppercase">Laudo Técnico</span>
                                    <div
                                        className="text-sm prose prose-sm max-w-none bg-blue-50/50 p-3 rounded"
                                        dangerouslySetInnerHTML={{ __html: ordem.laudo_tecnico }}
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Produtos e Serviços (Itens) */}
                    {ordem.itens && ordem.itens.length > 0 && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-sm font-semibold uppercase text-muted-foreground">
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
                                            <td colSpan={3} className="px-4 py-3 text-right text-muted-foreground">VALOR TOTAL DA OS:</td>
                                            <td className="px-4 py-3 text-right text-primary text-lg">
                                                {formatCurrency(ordem.valor_servico)}
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Observações do Cliente */}
                    {ordem.observacoes_cliente && (
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm font-semibold uppercase text-muted-foreground">
                                <AlertCircle className="h-4 w-4" />
                                Observações do Cliente
                            </div>
                            <div className="bg-yellow-50/50 border border-yellow-100 rounded-lg p-3 text-sm text-yellow-800 italic">
                                {ordem.observacoes_cliente}
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};
