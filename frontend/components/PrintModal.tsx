'use client';

import React, { useEffect, useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer, Loader2, Download, X } from 'lucide-react';
import { PrintTemplateA4 } from './PrintTemplateA4';
import { PrintTemplateThermal } from './PrintTemplateThermal';
import api, { API_URL } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface PrintModalProps {
    isOpen: boolean;
    onClose: () => void;
    ordemId: string | null;
    format: 'a4' | 'thermal';
}

export const PrintModal: React.FC<PrintModalProps> = ({ isOpen, onClose, ordemId, format }) => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<{
        ordem: any;
        tenantInfo: any;
        condicoesExecucao: string;
    } | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen && ordemId) {
            loadPrintData();
        } else {
            setData(null);
            setError(null);
        }
    }, [isOpen, ordemId]);

    const loadPrintData = async () => {
        try {
            setLoading(true);
            setError(null);

            const [ordemRes, configRes] = await Promise.all([
                api.get(`/api/ordem_servico/ordens/${ordemId}`),
                api.get('/api/ordem_servico/config/settings')
            ]);

            const ordem = ordemRes.data;
            const condicoesConfig = configRes.data.find((c: { config_key: string, config_value: string }) => c.config_key === 'condicoes_execucao');
            const condicoesExecucao = condicoesConfig ? condicoesConfig.config_value : '';

            const logoUrl = user?.tenant?.logoUrl
                ? `${API_URL}/uploads/logos/${user.tenant.logoUrl}`
                : undefined;

            const tenantInfo = {
                name: user?.tenant?.nomeFantasia || 'Empresa',
                document: user?.tenant?.cnpjCpf || '',
                address: '',
                phone: user?.tenant?.telefone || '',
                email: user?.tenant?.email || '',
                logo_url: logoUrl
            };

            setData({ ordem, tenantInfo, condicoesExecucao });
        } catch (err) {
            console.error('Erro ao carregar dados de impressão:', err);
            setError('Não foi possível carregar os dados para impressão.');
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        const printContent = document.getElementById('modal-print-area');
        if (!printContent) return;

        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        // Pegar todos os estilos da página atual
        const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
            .map(style => style.outerHTML)
            .join('');

        printWindow.document.write(`
            <html>
                <head>
                    <title>Impressão OS #${data?.ordem?.numero}</title>
                    ${styles}
                    <style>
                        @media print {
                            @page {
                                margin: ${format === 'thermal' ? '0' : '5mm 5mm 1mm 5mm'};
                                size: ${format === 'thermal' ? '80mm auto' : 'auto'};
                            }
                            body { margin: 0; padding: 0; }
                            .no-print { display: none !important; }
                        }
                    </style>
                </head>
                <body>
                    <div id="print-content">
                        ${printContent.innerHTML}
                    </div>
                    <script>
                        window.onload = () => {
                            window.print();
                            window.onafterprint = () => window.close();
                        };
                    </script>
                </body>
            </html>
        `);
        printWindow.document.close();
    };

    const handleDownloadPDF = async () => {
        if (!ordemId) return;
        try {
            const pdfUrl = `${API_URL}/api/ordem_servico/ordens/${ordemId}/pdf${format === 'thermal' ? '?format=thermal' : ''}`;
            const response = await api.get(pdfUrl, { responseType: 'blob' });
            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `OS_${data?.ordem?.numero || ordemId}${format === 'thermal' ? '-thermal' : ''}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Erro ao baixar PDF:', error);
            alert('Erro ao baixar PDF.');
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open: boolean) => !open && onClose()}>
            <DialogContent className={`${format === 'thermal' ? 'max-w-xs' : 'max-w-4xl'} max-h-[95vh] flex flex-col p-0 overflow-hidden`}>
                <DialogHeader className="p-4 border-b bg-muted/20 no-print">
                    <DialogTitle className="text-lg font-bold">
                        Prévia de Impressão ({format === 'thermal' ? '80mm' : 'A4'})
                    </DialogTitle>
                    <DialogDescription className="sr-only">
                        Visualize a ordem de serviço antes de imprimir ou gerar o PDF.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto p-4 bg-gray-100 flex justify-center">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-lg shadow w-full">
                            <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                            <p className="text-sm text-muted-foreground">Preparando documento...</p>
                        </div>
                    ) : error ? (
                        <div className="p-8 bg-white rounded-lg shadow text-center w-full">
                            <p className="text-destructive font-medium">{error}</p>
                            <Button variant="outline" onClick={loadPrintData} className="mt-4">
                                Tentar novamente
                            </Button>
                        </div>
                    ) : data ? (
                        <div
                            id="modal-print-area"
                            className={`${format === 'thermal' ? 'w-[80mm]' : 'w-[210mm]'} bg-white shadow-lg origin-top scale-[0.85] md:scale-100`}
                        >
                            {format === 'thermal' ? (
                                <PrintTemplateThermal
                                    ordem={data.ordem}
                                    tenantInfo={data.tenantInfo}
                                    condicoesExecucao={data.condicoesExecucao}
                                />
                            ) : (
                                <PrintTemplateA4
                                    ordem={data.ordem}
                                    tenantInfo={data.tenantInfo}
                                    condicoesExecucao={data.condicoesExecucao}
                                />
                            )}
                        </div>
                    ) : null}
                </div>

                <DialogFooter className="p-2 border-t flex flex-row items-center justify-between gap-2 no-print bg-muted/5">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        disabled={loading}
                        className="flex-1 h-8 text-[10px] border-red-200 text-red-500 hover:bg-red-50 hover:text-red-700 hover:border-red-300 transition-all font-medium px-1"
                    >
                        CANCELAR
                    </Button>
                    <Button
                        variant="secondary"
                        onClick={handleDownloadPDF}
                        disabled={loading || !data}
                        className="flex-1 h-8 gap-1 shadow-sm text-[10px] px-1"
                    >
                        <Download className="h-3 w-3" />
                        PDF
                    </Button>
                    <Button
                        onClick={handlePrint}
                        disabled={loading || !data}
                        className="flex-1 h-8 gap-1 shadow-md bg-primary hover:bg-primary/90 text-[10px] px-1"
                    >
                        <Printer className="h-3 w-3" />
                        IMPRIMIR
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
