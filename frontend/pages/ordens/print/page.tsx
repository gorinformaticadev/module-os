'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { PrintTemplateA4 } from '../../../components/PrintTemplateA4';
import { Button } from '@/components/ui/button';
import { Printer, ArrowLeft, Loader2, Download } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import api, { API_URL } from '@/lib/api';

interface OrdemServico {
    id: string;
    numero: string;
    data_abertura: string;
    data_previsao?: string;
    status: number;
    garantia_dias?: number;
    cliente?: any;
    tipo_servico: string;
    descricao: string;
    observacoes_cliente?: string;
    itens?: any[];
    valor_servico: number;
    equipamento_tipo?: string;
    equipamento_marca?: string;
    equipamento_modelo?: string;
    equipamento_serie?: string;
}

interface TenantInfo {
    name: string;
    document?: string;
    address?: string;
    phone?: string;
    email?: string;
    logo_url?: string;
}

export default function PrintPreviewPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { user } = useAuth();
    const ordemId = searchParams.get('id');

    const [loading, setLoading] = useState(true);
    const [ordem, setOrdem] = useState<OrdemServico | null>(null);
    const [tenantInfo, setTenantInfo] = useState<TenantInfo | null>(null);
    const [condicoesExecucao, setCondicoesExecucao] = useState<string>('');
    const [error, setError] = useState<string>('');

    useEffect(() => {
        if (!ordemId) {
            setError('ID da ordem não fornecido');
            setLoading(false);
            return;
        }

        loadPrintData();
    }, [ordemId, user]);

    const loadPrintData = async () => {
        try {
            setLoading(true);

            const ordemResponse = await api.get(`/api/ordem_servico/ordens/${ordemId}`);
            setOrdem(ordemResponse.data);

            if (user?.tenant) {
                let logoUrl = undefined;

                if (user.tenant.logoUrl) {
                    const originalUrl = `${API_URL}/uploads/logos/${user.tenant.logoUrl}?t=${Date.now()}`;
                    try {
                        const response = await fetch(originalUrl);
                        const blob = await response.blob();
                        logoUrl = await new Promise<string>((resolve) => {
                            const reader = new FileReader();
                            reader.onloadend = () => resolve(reader.result as string);
                            reader.readAsDataURL(blob);
                        });
                    } catch (error) {
                        console.error('Erro ao converter logo para base64:', error);
                        // Fallback para URL original se falhar a conversão
                        logoUrl = originalUrl;
                    }
                }

                setTenantInfo({
                    name: user.tenant.nomeFantasia || 'Empresa',
                    document: user.tenant.cnpjCpf || '',
                    address: '',
                    phone: user.tenant.telefone || '',
                    email: user.tenant.email || '',
                    logo_url: logoUrl
                });
            } else {
                setTenantInfo({
                    name: 'Empresa',
                    document: '',
                    address: '',
                    phone: '',
                    email: '',
                    logo_url: undefined
                });
            }

            try {
                const configResponse = await api.get('/api/ordem_servico/config/settings');
                const condicoesConfig = configResponse.data.find((c: any) => c.config_key === 'condicoes_execucao');
                if (condicoesConfig) {
                    setCondicoesExecucao(condicoesConfig.config_value);
                }
            } catch (err) {
                console.log('Condições de execução não encontradas');
            }

        } catch (err: any) {
            console.error('Erro ao carregar dados:', err);
            setError('Erro ao carregar dados da ordem de serviço');
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const handleDownloadPDF = async () => {
        if (!ordem || !ordem.id) return;

        try {
            setLoading(true); // Opcional, apenas para feedback visual rápido
            // URL do endpoint de PDF
            const pdfUrl = `${API_URL}/api/ordem_servico/ordens/${ordem.id}/pdf`;

            // Abrir em nova aba (ou baixar direto dependendo do header do backend)
            // Para baixar com token de auth, pode ser necessário usar fetch com blob, 
            // mas como é window.open, o browser gerencia. 
            // Se precisar de auth header, teremos que usar axios/fetch e blob.
            // Dado que a rota é protegida por JWT, window.open pode falhar se o cookie não estiver setado ou se o token estiver só no header.
            // 
            // VERIFICAÇÃO: O backend usa @UseGuards(JwtAuthGuard). O browser não envia o header Authorization automaticamente no window.open.
            // SOLUÇÃO: Usar axios com responseType 'blob' e criar url do objeto.

            const response = await api.get(pdfUrl, {
                responseType: 'blob'
            });

            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `OS_${ordem.numero}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

        } catch (error) {
            console.error('Erro ao baixar PDF:', error);
            alert('Erro ao baixar PDF. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
                    <p className="text-muted-foreground">Carregando dados para impressão...</p>
                </div>
            </div>
        );
    }

    if (error || !ordem || !tenantInfo) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <h2 className="text-2xl font-bold mb-4 text-destructive">Erro</h2>
                    <p className="text-muted-foreground mb-4">{error || 'Dados não encontrados'}</p>
                    <Button onClick={() => router.push('/modules/ordem_servico/pages/ordens')}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Voltar para Ordens
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="no-print sticky top-0 z-50 bg-background border-b p-4 flex justify-between items-center shadow-sm">
                <Button variant="outline" onClick={() => router.push('/modules/ordem_servico/pages/ordens')}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Voltar
                </Button>
                <div className="flex gap-2">
                    <Button onClick={handleDownloadPDF} variant="outline" className="gap-2">
                        <Download className="h-4 w-4" />
                        Download PDF (Via 1)
                    </Button>
                    <Button onClick={handlePrint} className="gap-2">
                        <Printer className="h-4 w-4" />
                        Imprimir
                    </Button>
                </div>
            </div>

            <div id="print-area">
                <PrintTemplateA4
                    ordem={ordem}
                    tenantInfo={tenantInfo}
                    condicoesExecucao={condicoesExecucao}
                />
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                @media print {
                    @page {
                        margin: 5mm 5mm 1mm 5mm;
                        size: auto;
                    }

                    body * {
                        visibility: hidden;
                    }

                    #print-area, #print-area * {
                        visibility: visible;
                    }

                    #print-area {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        z-index: 9999;
                        background: white;
                    }

                    .no-print {
                        display: none !important;
                    }
                }
            `}} />
        </div>
    );
}
