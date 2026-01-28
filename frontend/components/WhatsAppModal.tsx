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
import { MessageCircle } from 'lucide-react';
import api from '@/lib/api';
import { WhatsAppEditor } from './WhatsAppEditor';
import { useAuth } from '@/contexts/AuthContext';

interface WhatsAppModalProps {
    isOpen: boolean;
    onClose: () => void;
    ordem: OrdemServico | null;
}

type SendMethod = 'api' | 'web' | 'crm';

export function WhatsAppModal({ isOpen, onClose, ordem }: WhatsAppModalProps) {
    const { user } = useAuth();
    const [message, setMessage] = useState('');
    const [method, setMethod] = useState<SendMethod>('api');

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
            }
        };

        fetchTemplateAndSetMessage();
    }, [isOpen, ordem, user]);

    const handleSend = () => {
        if (!ordem?.cliente?.phone_primary) return;

        const phone = ordem.cliente.phone_primary.replace(/\D/g, '');
        const encodedMessage = encodeURIComponent(message);

        let url = '';
        if (method === 'api') {
            url = `https://wa.me/55${phone}?text=${encodedMessage}`;
        } else if (method === 'web') {
            url = `https://web.whatsapp.com/send?phone=55${phone}?text=${encodedMessage}`; // Fix URL query params
        } else {
            // CRM implementation pending
            return;
        }

        window.open(url, '_blank');
        onClose();
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

                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancelar</Button>
                    <Button onClick={handleSend} className="bg-green-600 hover:bg-green-700 text-white gap-2">
                        <MessageCircle className="h-4 w-4" />
                        Enviar Mensagem
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
