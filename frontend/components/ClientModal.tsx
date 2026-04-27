"use client";

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Camera, Loader2, User, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import ProtectedModuleImage from './ProtectedModuleImage';

interface ClientModalProps {
    isOpen: boolean;
    onClose: () => void;
    onClientCreated?: (client: any) => void;
}

export default function ClientModal({ isOpen, onClose, onClientCreated }: ClientModalProps) {
    const { toast } = useToast();
    const [saving, setSaving] = useState(false);
    const [compressing, setCompressing] = useState(false);
    const [showAddress, setShowAddress] = useState(false);
    const [validationErrors, setValidationErrors] = useState({
        phone_primary: '',
        document: ''
    });

    const [formData, setFormData] = useState({
        name: '',
        document: '',
        phone_primary: '',
        phone_secondary: '',
        email: '',
        address_zip: '',
        address_street: '',
        address_number: '',
        address_complement: '',
        address_neighborhood: '',
        address_city: '',
        address_state: '',
        observations: '',
        image_url: '',
        is_active: true
    });

    const resetForm = () => {
        setFormData({
            name: '',
            document: '',
            phone_primary: '',
            phone_secondary: '',
            email: '',
            address_zip: '',
            address_street: '',
            address_number: '',
            address_complement: '',
            address_neighborhood: '',
            address_city: '',
            address_state: '',
            observations: '',
            image_url: '',
            is_active: true
        });
        setShowAddress(false);
        setValidationErrors({
            phone_primary: '',
            document: ''
        });
    };

    const maskPhone = (value: string) => {
        return value
            .replace(/\D/g, '')
            .replace(/^(\d{2})(\d)/g, '($1) $2')
            .replace(/(\d)(\d{4})$/, '$1-$2')
            .slice(0, 15);
    };

    const maskDocument = (value: string) => {
        const v = value.replace(/\D/g, '');
        if (v.length <= 11) {
            return v
                .replace(/(\d{3})(\d)/, '$1.$2')
                .replace(/(\d{3})(\d)/, '$1.$2')
                .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
                .slice(0, 14);
        }
        return v
            .replace(/^(\d{2})(\d)/, '$1.$2')
            .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
            .replace(/\.(\d{3})(\d)/, '.$1/$2')
            .replace(/(\d{4})(\d)/, '$1-$2')
            .slice(0, 18);
    };

    const validatePhone = (phone: string) => {
        const cleanPhone = phone.replace(/\D/g, '');
        if (cleanPhone.length < 10) {
            return 'Telefone deve ter pelo menos 10 dígitos';
        }
        if (cleanPhone.length > 11) {
            return 'Telefone deve ter no máximo 11 dígitos';
        }
        return '';
    };

    const validateEmail = (email: string) => {
        if (!email) return '';
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return 'Email inválido';
        }
        return '';
    };

    const maskCEP = (value: string) => {
        return value
            .replace(/\D/g, '')
            .replace(/^(\d{5})(\d)/, '$1-$2')
            .slice(0, 9);
    };

    const fetchAddressByCEP = async (cep: string) => {
        const cleanCEP = cep.replace(/\D/g, '');

        if (cleanCEP.length !== 8) {
            return;
        }

        try {
            const response = await api.get(`/api/ordem_servico/clientes/cep/${cleanCEP}`);
            const data = response.data;

            if (data.success) {
                setFormData(prev => ({
                    ...prev,
                    address_street: data.logradouro || '',
                    address_neighborhood: data.bairro || '',
                    address_city: data.localidade || '',
                    address_state: data.uf || ''
                }));

                toast({
                    title: 'CEP encontrado!',
                    description: `Endereço preenchido automaticamente: ${data.localidade}/${data.uf}`,
                    variant: 'default'
                });
            } else {
                toast({
                    title: 'CEP não encontrado',
                    description: 'Verifique o CEP informado.',
                    variant: 'destructive'
                });
            }
        } catch (error: any) {
            console.error('❌ Erro ao buscar CEP:', error);

            let errorMessage = 'Não foi possível consultar o CEP.';
            if (error.response?.status === 404) {
                errorMessage = 'CEP não encontrado.';
            } else if (error.response?.status === 400) {
                errorMessage = 'CEP inválido.';
            }

            toast({
                title: 'Erro na consulta',
                description: errorMessage,
                variant: 'destructive'
            });
        }
    };

    const validateDocument = (document: string) => {
        if (!document) return '';

        const cleanDoc = document.replace(/\D/g, '');

        if (cleanDoc.length === 11) {
            // Validação CPF
            if (!/^\d{11}$/.test(cleanDoc)) return 'CPF inválido';

            // Verifica se todos os dígitos são iguais
            if (/^(\d)\1{10}$/.test(cleanDoc)) return 'CPF inválido';

            // Validação dos dígitos verificadores
            let sum = 0;
            for (let i = 0; i < 9; i++) {
                sum += parseInt(cleanDoc.charAt(i)) * (10 - i);
            }
            let digit1 = 11 - (sum % 11);
            if (digit1 > 9) digit1 = 0;

            sum = 0;
            for (let i = 0; i < 10; i++) {
                sum += parseInt(cleanDoc.charAt(i)) * (11 - i);
            }
            let digit2 = 11 - (sum % 11);
            if (digit2 > 9) digit2 = 0;

            if (parseInt(cleanDoc.charAt(9)) !== digit1 || parseInt(cleanDoc.charAt(10)) !== digit2) {
                return 'CPF inválido';
            }
        } else if (cleanDoc.length === 14) {
            // Validação CNPJ
            if (!/^\d{14}$/.test(cleanDoc)) return 'CNPJ inválido';

            // Verifica se todos os dígitos são iguais
            if (/^(\d)\1{13}$/.test(cleanDoc)) return 'CNPJ inválido';

            // Validação dos dígitos verificadores
            const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
            const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

            let sum = 0;
            for (let i = 0; i < 12; i++) {
                sum += parseInt(cleanDoc.charAt(i)) * weights1[i];
            }
            let digit1 = sum % 11 < 2 ? 0 : 11 - (sum % 11);

            sum = 0;
            for (let i = 0; i < 13; i++) {
                sum += parseInt(cleanDoc.charAt(i)) * weights2[i];
            }
            let digit2 = sum % 11 < 2 ? 0 : 11 - (sum % 11);

            if (parseInt(cleanDoc.charAt(12)) !== digit1 || parseInt(cleanDoc.charAt(13)) !== digit2) {
                return 'CNPJ inválido';
            }
        } else {
            return 'Documento deve ter 11 dígitos (CPF) ou 14 dígitos (CNPJ)';
        }

        return '';
    };

    const compressImage = (file: File): Promise<Blob> => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target?.result as string;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;
                    const max_size = 400; // Avatar size

                    if (width > height) {
                        if (width > max_size) {
                            height *= max_size / width;
                            width = max_size;
                        }
                    } else {
                        if (height > max_size) {
                            width *= max_size / height;
                            height = max_size;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx?.drawImage(img, 0, 0, width, height);
                    canvas.toBlob((blob) => {
                        if (blob) resolve(blob);
                    }, 'image/jpeg', 0.7);
                };
            };
        });
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setCompressing(true);
            const blob = await compressImage(file);

            const formDataUpload = new FormData();
            formDataUpload.append('file', blob, 'avatar.jpg');

            const { data } = await api.post('/api/ordem_servico/clientes/upload', formDataUpload, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            setFormData({ ...formData, image_url: data.url });

            toast({
                title: 'Sucesso',
                description: 'Imagem processada com sucesso.',
                variant: 'default'
            });
        } catch (error) {
            console.error('Erro no upload:', error);
            toast({
                title: 'Erro na imagem',
                description: 'Não foi possível enviar a imagem.',
                variant: 'destructive'
            });
        } finally {
            setCompressing(false);
        }
    };

    const handleSave = async () => {
        // Validações
        const phoneError = validatePhone(formData.phone_primary);
        const documentError = validateDocument(formData.document);

        setValidationErrors({
            phone_primary: phoneError,
            document: documentError
        });

        if (!formData.name || !formData.phone_primary) {
            toast({
                title: 'Campos obrigatórios',
                description: 'Preencha o Nome e o Telefone Principal.',
                variant: 'destructive'
            });
            return;
        }

        if (phoneError || documentError) {
            toast({
                title: 'Dados inválidos',
                description: 'Corrija os erros nos campos destacados.',
                variant: 'destructive'
            });
            return;
        }

        try {
            setSaving(true);
            const response = await api.post('/api/ordem_servico/clientes', formData);
            toast({ title: 'Cliente cadastrado com sucesso!' });

            // Chama callback se fornecido
            if (onClientCreated) {
                onClientCreated(response.data);
            }

            resetForm();
            onClose();
        } catch (error) {
            toast({
                title: 'Erro ao salvar',
                description: 'Ocorreu um erro ao salvar o cliente.',
                variant: 'destructive'
            });
        } finally {
            setSaving(false);
        }
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Novo Cliente</DialogTitle>
                    <DialogDescription>
                        Preencha os dados obrigatórios para cadastrar.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4 space-y-6">
                    {/* Imagem de Perfil */}
                    <div className="flex flex-col items-center gap-4">
                        <div className="relative group">
                            <div className="h-32 w-32 rounded-3xl bg-skin-background/10 dark:bg-skin-background-hover border-2 border-dashed border-skin-background dark:border-skin-background flex items-center justify-center overflow-hidden transition-all group-hover:border-primary/50 shadow-inner">
                                {formData.image_url ? (
                                    <>
                                        <ProtectedModuleImage
                                            src={formData.image_url}
                                            alt="Logo"
                                            className="h-full w-full object-cover transition-transform group-hover:scale-110"
                                        />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <Button size="icon" variant="destructive" className="h-8 w-8 rounded-full" onClick={() => setFormData({ ...formData, image_url: '' })}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex flex-col items-center gap-1 text-skin-text-muted">
                                        {compressing ? (
                                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                        ) : (
                                            <>
                                                <User className="h-12 w-12 opacity-20" />
                                                <span className="text-[10px] font-medium uppercase tracking-tighter text-skin-background">Sem Foto</span>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                            <Button
                                type="button"
                                size="icon"
                                variant="secondary"
                                className="absolute -bottom-2 -right-2 h-10 w-10 rounded-full border-4 border-background shadow-lg hover:scale-110 transition-transform active:scale-95"
                                onClick={() => document.getElementById('client-image-upload')?.click()}
                                disabled={compressing}
                            >
                                <Camera className="h-4 w-4" />
                            </Button>
                            <input
                                id="client-image-upload"
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleImageUpload}
                            />
                        </div>
                        <p className="text-[10px] text-skin-text-muted text-center uppercase tracking-widest font-bold">Foto do Cliente</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2 space-y-2">
                            <Label htmlFor="client-name" className="text-xs font-bold uppercase tracking-wider text-skin-background">Nome Completo *</Label>
                            <Input
                                id="client-name"
                                className="h-11 bg-skin-background/50 dark:bg-skin-background-hover/50 border-skin-background dark:border-skin-background"
                                value={formData.name}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Nome do cliente"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="client-document" className="text-xs font-bold uppercase tracking-wider text-skin-background">CPF / CNPJ</Label>
                            <Input
                                id="client-document"
                                className={`h-11 bg-skin-background/50 dark:bg-skin-background-hover/50 ${validationErrors.document ? 'border-skin-danger focus:ring-skin-danger' : 'border-skin-background dark:border-skin-background'}`}
                                value={formData.document}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                    const maskedValue = maskDocument(e.target.value);
                                    setFormData({ ...formData, document: maskedValue });
                                    const error = validateDocument(maskedValue);
                                    setValidationErrors(prev => ({ ...prev, document: error }));
                                }}
                                placeholder="000.000.000-00"
                            />
                            {validationErrors.document && (
                                <p className="text-[10px] text-skin-danger font-bold ml-1">{validationErrors.document}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase tracking-wider text-skin-background">Status da Conta</Label>
                            <div className="flex items-center space-x-3 h-11 px-3 rounded-lg bg-skin-background/50 dark:bg-skin-background-hover/50 border border-skin-background dark:border-skin-background">
                                <Switch
                                    id="client-active"
                                    checked={formData.is_active}
                                    onCheckedChange={(checked: boolean) => setFormData({ ...formData, is_active: checked })}
                                />
                                <Label htmlFor="client-active" className="text-sm cursor-pointer">{formData.is_active ? 'Ativo' : 'Inativo'}</Label>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="client-phone1" className="text-xs font-bold uppercase tracking-wider text-skin-background">Telefone Principal *</Label>
                            <Input
                                id="client-phone1"
                                className={`h-11 bg-skin-background/50 dark:bg-skin-background-hover/50 ${validationErrors.phone_primary ? 'border-skin-danger focus:ring-skin-danger' : 'border-skin-background dark:border-skin-background'}`}
                                value={formData.phone_primary}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                    const maskedValue = maskPhone(e.target.value);
                                    setFormData({ ...formData, phone_primary: maskedValue });
                                    const error = validatePhone(maskedValue);
                                    setValidationErrors(prev => ({ ...prev, phone_primary: error }));
                                }}
                                placeholder="(00) 00000-0000"
                            />
                            {validationErrors.phone_primary && (
                                <p className="text-[10px] text-skin-danger font-bold ml-1">{validationErrors.phone_primary}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="client-phone2" className="text-xs font-bold uppercase tracking-wider text-skin-background">Telefone Secundário</Label>
                            <Input
                                id="client-phone2"
                                className="h-11 bg-skin-background/50 dark:bg-skin-background-hover/50 border-skin-background dark:border-skin-background"
                                value={formData.phone_secondary}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, phone_secondary: maskPhone(e.target.value) })}
                                placeholder="(00) 00000-0000"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="client-email" className="text-xs font-bold uppercase tracking-wider text-skin-background">Email</Label>
                            <Input
                                id="client-email"
                                type="email"
                                className="h-11 bg-skin-background/50 dark:bg-skin-background-hover/50 border-skin-background dark:border-skin-background"
                                value={formData.email}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, email: e.target.value })}
                                placeholder="cliente@email.com"
                            />
                        </div>

                        <div className="md:col-span-2 space-y-2">
                            <Label htmlFor="client-observations" className="text-xs font-bold uppercase tracking-wider text-skin-background">Observações Gerais</Label>
                            <Textarea
                                id="client-observations"
                                className="min-h-[100px] bg-skin-background/50 dark:bg-skin-background-hover/50 border-skin-background dark:border-skin-background resize-none"
                                value={formData.observations}
                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, observations: e.target.value })}
                                placeholder="Notas sobre o cliente, preferências, histórico relevante..."
                            />
                        </div>

                        <div className="md:col-span-2 pt-2">
                            <Button
                                type="button"
                                variant="ghost"
                                className="w-full flex justify-between items-center group hover:bg-skin-background/10 dark:hover:bg-skin-background-hover"
                                onClick={() => setShowAddress(!showAddress)}
                            >
                                <span className="text-xs font-bold uppercase tracking-wider text-skin-background">Informações de Endereço</span>
                                {showAddress ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </Button>
                        </div>

                        {showAddress && (
                            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                <div className="space-y-2">
                                    <Label htmlFor="client-zip" className="text-xs font-bold uppercase tracking-wider text-skin-background">CEP</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            id="client-zip"
                                            className="h-11 bg-skin-background/50 dark:bg-skin-background-hover/50 border-skin-background dark:border-skin-background"
                                            value={formData.address_zip}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                                const maskedCEP = maskCEP(e.target.value);
                                                setFormData({ ...formData, address_zip: maskedCEP });
                                            }}
                                            onBlur={() => {
                                                const cleanCEP = formData.address_zip.replace(/\D/g, '');
                                                if (cleanCEP.length === 8) {
                                                    fetchAddressByCEP(formData.address_zip);
                                                }
                                            }}
                                            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                                                if (e.key === 'Tab' || e.key === 'Enter') {
                                                    const cleanCEP = formData.address_zip.replace(/\D/g, '');
                                                    if (cleanCEP.length === 8) {
                                                        fetchAddressByCEP(formData.address_zip);
                                                    }
                                                }
                                            }}
                                            placeholder="00000-000"
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="icon"
                                            className="h-11 w-11 shrink-0"
                                            onClick={() => {
                                                const cleanCEP = formData.address_zip.replace(/\D/g, '');
                                                if (cleanCEP.length === 8) {
                                                    fetchAddressByCEP(formData.address_zip);
                                                } else {
                                                    toast({
                                                        title: 'CEP incompleto',
                                                        description: 'Digite um CEP com 8 dígitos.',
                                                        variant: 'destructive'
                                                    });
                                                }
                                            }}
                                            title="Buscar endereço"
                                        >
                                            🔍
                                        </Button>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="client-street" className="text-xs font-bold uppercase tracking-wider text-skin-background">Rua</Label>
                                    <Input
                                        id="client-street"
                                        className="h-11 bg-skin-background/50 dark:bg-skin-background-hover/50 border-skin-background dark:border-skin-background"
                                        value={formData.address_street}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, address_street: e.target.value })}
                                        placeholder="Rua / Avenida"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="client-number" className="text-xs font-bold uppercase tracking-wider text-skin-background">Número</Label>
                                    <Input
                                        id="client-number"
                                        className="h-11 bg-skin-background/50 dark:bg-skin-background-hover/50 border-skin-background dark:border-skin-background"
                                        value={formData.address_number}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, address_number: e.target.value })}
                                        placeholder="123"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="client-complement" className="text-xs font-bold uppercase tracking-wider text-skin-background">Complemento</Label>
                                    <Input
                                        id="client-complement"
                                        className="h-11 bg-skin-background/50 dark:bg-skin-background-hover/50 border-skin-background dark:border-skin-background"
                                        value={formData.address_complement}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, address_complement: e.target.value })}
                                        placeholder="Apto, Sala, etc."
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="client-neighborhood" className="text-xs font-bold uppercase tracking-wider text-skin-background">Bairro</Label>
                                    <Input
                                        id="client-neighborhood"
                                        className="h-11 bg-skin-background/50 dark:bg-skin-background-hover/50 border-skin-background dark:border-skin-background"
                                        value={formData.address_neighborhood}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, address_neighborhood: e.target.value })}
                                        placeholder="Bairro"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="client-city" className="text-xs font-bold uppercase tracking-wider text-skin-background">Cidade</Label>
                                    <Input
                                        id="client-city"
                                        className="h-11 bg-skin-background/50 dark:bg-skin-background-hover/50 border-skin-background dark:border-skin-background"
                                        value={formData.address_city}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, address_city: e.target.value })}
                                        placeholder="Cidade"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="client-state" className="text-xs font-bold uppercase tracking-wider text-skin-background">UF</Label>
                                    <Input
                                        id="client-state"
                                        className="h-11 bg-skin-background/50 dark:bg-skin-background-hover/50 border-skin-background dark:border-skin-background"
                                        value={formData.address_state}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, address_state: e.target.value })}
                                        placeholder="UF"
                                        maxLength={2}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={handleClose}>Cancelar</Button>
                    <Button onClick={handleSave} disabled={saving}>
                        {saving ? 'Salvando...' : 'Salvar'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
