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
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { OrdemServico, STATUS_LABELS } from '../types/ordem-servico.types';
import { History, Loader2, MessageCircle } from 'lucide-react';
import api from '@/lib/api';
import { WhatsAppEditor } from './WhatsAppEditor';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { WhatsAppHistory } from './WhatsAppHistory';

interface WhatsAppModalProps {
    isOpen: boolean;
    onClose: () => void;
    ordem: OrdemServico | null;
}

type SendMethod = 'api' | 'web' | 'crm';

export function WhatsAppModal({ isOpen, onClose, ordem }: WhatsAppModalProps) {
    const { user } = useAuth();
    const { toast } = useToast();
    const [message, setMessage] = useState('');
    const [method, setMethod] = useState<SendMethod>('api');
    const [sending, setSending] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [historyRefreshKey, setHistoryRefreshKey] = useState(0);

    useEffect(() => {
        const fetchTemplateAndSetMessage = async () => {
            if (isOpen && ordem) {
                try {
                    // Tentar obter o template salvo
                    const response = await api.get('/api/ordem_servico/config/settings');
                    const whatsappConfig = response.data.find((c: any) => c.config_key === 'whatsapp_message_template');

                    let template = whatsappConfig?.config_value;

                    if (!template) {
                        // Default template if none exists
                        template = 'Olá {{nomeCliente}}, referente a OS #{{numeroOS}} - {{descricaoOS}}.';
                    }

                    // Helper to strip HTML tags
                    const stripHtml = (html: string | undefined | null) => {
                        if (!html) return '';
                        const doc = new DOMParser().parseFromString(html, 'text/html');
                        return doc.body.textContent || "";
                    };

                    // Preparar variáveis
                    const nomeFantasia = user?.tenant?.nomeFantasia || 'Nossa Empresa';
                    const telefoneEmpresa = user?.tenant?.telefone || '';
                    const dataCriacao = ordem.created_at ? new Date(ordem.created_at).toLocaleDateString() : '';

                    // Lista de itens formatada
                    let listaItens = '';
                    if (ordem.itens && ordem.itens.length > 0) {
                        listaItens = ordem.itens.map(item =>
                            `- ${item.quantidade}x ${item.descricao} (R$ ${item.valor_total.toFixed(2)})`
                        ).join('\n');
                    } else {
                        listaItens = '- Nenhum item listado.';
                    }

                    // Replace variables
                    const formattedMessage = template
                        .replace(/{{nomeCliente}}/g, ordem.cliente?.name || 'Cliente')
                        .replace(/{{numeroOS}}/g, ordem.numero?.toString() || '')
                        .replace(/{{descricaoOS}}/g, stripHtml(ordem.descricao) || '')
                        .replace(/{{statusOS}}/g, STATUS_LABELS[ordem.status] || '')
                        .replace(/{{valorTotal}}/g, ordem.valor_servico ? `R$ ${ordem.valor_servico.toFixed(2)}` : 'R$ 0,00')
                        .replace(/{{dataCriacao}}/g, dataCriacao)
                        .replace(/{{tipoEquipamento}}/g, ordem.equipamento_tipo || '')
                        .replace(/{{marcaEquipamento}}/g, ordem.equipamento_marca || '')
                        .replace(/{{modeloEquipamento}}/g, ordem.equipamento_modelo || '')
                        .replace(/{{observacoesOs}}/g, stripHtml(ordem.observacoes_internas) || 'Nenhuma observação.')
                        .replace(/{{laudoTecnico}}/g, stripHtml(ordem.laudo_tecnico) || 'Sem laudo técnico.')
                        .replace(/{{listaItens}}/g, listaItens)
                        .replace(/{{telefoneEmpresa}}/g, telefoneEmpresa)
                        .replace(/{{nomeFantasia}}/g, nomeFantasia);

                    setMessage(formattedMessage);
                } catch (error) {
                    console.error('Erro ao carregar template de WhatsApp:', error);
                    // Fallback em caso de erro
                    setMessage(`Olá! Sobre a OS #${ordem.numero} - ${ordem.descricao}`);
                }
                setMethod('api'); // Default
                setShowHistory(false);
            }
        };

        fetchTemplateAndSetMessage();
    }, [isOpen, ordem, user]);

    const handleSend = async () => {
        if (sending || !message.trim()) return;

        if (!ordem?.cliente?.phone_primary) {
            toast({
                title: 'Telefone ausente',
                description: 'Cadastre um telefone principal no cliente antes de enviar.',
                variant: 'destructive',
            });
            return;
        }

        const phone = ordem.cliente.phone_primary.replace(/\D/g, '');
        const encodedMessage = encodeURIComponent(message);

        let url = '';
        if (method === 'api') {
            url = `https://wa.me/55${phone}?text=${encodedMessage}`;
        } else if (method === 'web') {
            url = `https://web.whatsapp.com/send?phone=55${phone}&text=${encodedMessage}`;
        } else {
            // CRM implementation pending
            return;
        }

        const targetWindow = window.open('', '_blank');
        try {
            setSending(true);
            await api.post(`/api/ordem_servico/ordens/${ordem.id}/whatsapp-envios`, {
                forma_envio: method,
                mensagem: message,
            });
            setHistoryRefreshKey((key) => key + 1);

            if (targetWindow) {
                targetWindow.location.href = url;
            } else {
                window.open(url, '_blank');
            }

            toast({
                title: 'Envio registrado',
                description: 'O historico de WhatsApp desta OS foi atualizado.',
            });
            onClose();
        } catch (error) {
            targetWindow?.close();
            console.error('Erro ao registrar envio de WhatsApp:', error);
            toast({
                title: 'Erro ao registrar envio',
                description: 'A mensagem nao foi aberta porque o registro falhou.',
                variant: 'destructive',
            });
        } finally {
            setSending(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <MessageCircle className="h-5 w-5 text-green-600" />
                        Enviar WhatsApp
                    </DialogTitle>
                    <DialogDescription>
                        Envie uma mensagem para o cliente sobre a Ordem de Serviço #{ordem?.numero}.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">

                    <div className="space-y-2">
                        <Label>Mensagem</Label>
                        <WhatsAppEditor
                            value={message}
                            onChange={setMessage}
                            placeholder="Digite sua mensagem..."
                        />
                    </div>

                    <div className="space-y-3 pt-2">
                        <Label>Enviar via</Label>
                        <RadioGroup value={method} onValueChange={(v: string) => setMethod(v as SendMethod)} className="flex gap-4">
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="api" id="r-api" />
                                <Label htmlFor="r-api" className="cursor-pointer">App Desktop (API)</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="web" id="r-web" />
                                <Label htmlFor="r-web" className="cursor-pointer">WhatsApp Web</Label>
                            </div>
                            <div className="flex items-center space-x-2 opacity-50 cursor-not-allowed" title="Em breve">
                                <RadioGroupItem value="crm" id="r-crm" disabled />
                                <Label htmlFor="r-crm" className="cursor-not-allowed">CRM</Label>
                            </div>
                        </RadioGroup>
                    </div>

                    {ordem?.id && (
                        <div className="space-y-3 rounded-md border bg-muted/20 p-3">
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="gap-2 px-2"
                                onClick={() => setShowHistory((value) => !value)}
                            >
                                <History className="h-4 w-4" />
                                {showHistory ? 'Ocultar historico' : 'Historico de envios'}
                            </Button>
                            {showHistory && (
                                <WhatsAppHistory
                                    ordemId={ordem.id}
                                    refreshKey={historyRefreshKey}
                                    compact
                                />
                            )}
                        </div>
                    )}

                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={sending}>Cancelar</Button>
                    <Button onClick={handleSend} disabled={sending || !message.trim()} className="bg-green-600 hover:bg-green-700 text-white gap-2">
                        {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageCircle className="h-4 w-4" />}
                        {sending ? 'Registrando...' : 'Enviar Mensagem'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
