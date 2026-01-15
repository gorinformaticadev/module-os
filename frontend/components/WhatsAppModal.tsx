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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { OrdemServico } from '../types/ordem-servico.types';
import {
    Bold,
    Italic,
    Strikethrough,
    Code,
    List,
    ListOrdered,
    Quote,
    MessageCircle
} from 'lucide-react';

interface WhatsAppModalProps {
    isOpen: boolean;
    onClose: () => void;
    ordem: OrdemServico | null;
}

type SendMethod = 'api' | 'web' | 'crm';

export function WhatsAppModal({ isOpen, onClose, ordem }: WhatsAppModalProps) {
    const [message, setMessage] = useState('');
    const [method, setMethod] = useState<SendMethod>('api');

    useEffect(() => {
        if (isOpen && ordem) {
            setMessage(`Olá! Sobre a OS #${ordem.numero} - ${ordem.descricao}`);
            setMethod('api'); // Default
        }
    }, [isOpen, ordem]);

    const insertFormat = (prefix: string, suffix: string = prefix) => {
        const textarea = document.getElementById('whatsapp-message') as HTMLTextAreaElement;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = textarea.value;

        const before = text.substring(0, start);
        const selection = text.substring(start, end);
        const after = text.substring(end);

        const newText = `${before}${prefix}${selection}${suffix}${after}`;
        setMessage(newText);

        // Restore focus and selection
        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(start + prefix.length, end + prefix.length);
        }, 0);
    };

    const insertList = (ordered: boolean) => {
        const textarea = document.getElementById('whatsapp-message') as HTMLTextAreaElement;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = textarea.value;

        const before = text.substring(0, start);
        const selection = text.substring(start, end);
        const after = text.substring(end);

        let newSelection = selection;

        // If there's a selection, apply to each line
        if (selection.length > 0) {
            const lines = selection.split('\n');
            newSelection = lines.map((line, index) => {
                const marker = ordered ? `${index + 1}. ` : '- ';
                return `${marker}${line}`;
            }).join('\n');
        } else {
            // If no selection, just insert one marker
            newSelection = ordered ? '1. ' : '- ';
        }

        const newText = `${before}${newSelection}${after}`;
        setMessage(newText);

        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(start + newSelection.length, start + newSelection.length);
        }, 0);
    }

    const handleSend = () => {
        if (!ordem?.cliente?.phone_primary) return;

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

                        {/* Toolbar */}
                        <div className="flex flex-wrap gap-1 p-1 border rounded-t-md bg-muted/50 border-b-0">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => insertFormat('*')} title="Negrito">
                                <Bold className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => insertFormat('_')} title="Itálico">
                                <Italic className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => insertFormat('~')} title="Rasurado">
                                <Strikethrough className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => insertFormat('```')} title="Monoespaçado">
                                <Code className="h-4 w-4" />
                            </Button>
                            <div className="w-px h-6 bg-border mx-1 my-auto" />
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => insertList(false)} title="Lista com marcas">
                                <List className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => insertList(true)} title="Lista numerada">
                                <ListOrdered className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => insertFormat('> ', '')} title="Citação">
                                <Quote className="h-4 w-4" />
                            </Button>
                        </div>

                        <Textarea
                            id="whatsapp-message"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            className="min-h-[150px] rounded-t-none mt-0 resize-none font-mono text-sm"
                            placeholder="Digite sua mensagem..."
                        />
                    </div>

                    <div className="text-xs text-muted-foreground bg-muted p-2 rounded border">
                        <p className="font-semibold mb-1">Dicas de formatação:</p>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                            <span>*negrito*</span>
                            <span>_itálico_</span>
                            <span>~rasurado~</span>
                            <span>```mono```</span>
                        </div>
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
