import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

interface PrintTemplateThermalProps {
    ordem: any;
    tenantInfo: any;
    condicoesExecucao: string;
}

export const PrintTemplateThermal: React.FC<PrintTemplateThermalProps> = ({ ordem, tenantInfo, condicoesExecucao }) => {
    const formatDate = (dateString: string) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR');
    };

    const formatDateTime = (dateString: string) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return `${date.toLocaleDateString('pt-BR')} ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value || 0);
    };

    const formatCpfCnpj = (document?: string): string => {
        if (!document) return '';
        const numbers = document.replace(/\D/g, '');
        if (numbers.length === 11) {
            return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
        } else if (numbers.length === 14) {
            return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
        }
        return document;
    };

    const getStatusLabel = (status: number) => {
        const labels: Record<number, string> = {
            0: 'Orçamento',
            1: 'Aberto',
            2: 'Em Análise',
            3: 'Aguardando Cliente',
            4: 'Aguardando Peças',
            5: 'Em Execução',
            6: 'Finalizado',
            7: 'Cancelado'
        };
        return labels[status] || 'Desconhecido';
    };

    // Helper para limpar HTML e manter quebras de linha básicas
    const stripHtml = (html: string) => {
        if (!html) return '';

        let text = html
            .replace(/<p[^>]*>/gi, '') // Remove tags <p> mas mantém o conteúdo
            .replace(/<\/p>/gi, '\n')  // Fecha </p> com quebra de linha
            .replace(/<br\s*\/?>/gi, '\n') // <br> vira quebra de linha
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'");

        // Remover todas as outras tags
        text = text.replace(/<[^>]*>?/gm, '');

        return text.trim();
    };

    return (
        <div className="thermal-container font-sans text-[11px] leading-tight text-black bg-white p-2 max-w-[80mm] mx-auto border border-gray-100">
            {/* Header: Logo e Info lado a lado */}
            <div className="flex items-start mb-3 border-b border-gray-400 pb-2">
                <div className="w-[80px] mr-2">
                    {tenantInfo.logo_url && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={tenantInfo.logo_url} alt="Logo" className="max-w-full h-auto" />
                    )}
                </div>
                <div className="flex-1 text-[9px]">
                    <div className="font-bold uppercase text-[10px]">{tenantInfo.name}</div>
                    {tenantInfo.document && <div>CNPJ: {formatCpfCnpj(tenantInfo.document)}</div>}
                    {tenantInfo.address && <div>{tenantInfo.address}</div>}
                    {tenantInfo.phone && <div>Fone: {tenantInfo.phone}</div>}
                </div>
            </div>

            {/* Título da OS em uma caixa */}
            <div className="border border-black p-1 text-center font-bold text-[12px] mb-2 uppercase">
                Documento de controle de OS #{ordem.numero}
            </div>

            {/* Meta Info: Emissão, Status, Prev */}
            <div className="text-center text-[9px] mb-1">
                Emissão: {formatDateTime(ordem.data_abertura)}
            </div>
            <div className="flex justify-between items-center text-[10px] mb-3">
                <div className="flex items-center">
                    <span className="font-bold mr-1">Status:</span>
                    <span>{getStatusLabel(ordem.status)}</span>
                </div>
                {ordem.data_previsao && (
                    <div className="flex items-center">
                        <span className="font-bold mr-1">Prev:</span>
                        <span>{formatDate(ordem.data_previsao)}</span>
                        {ordem.garantia_dias && (
                            <>
                                <span className="font-bold ml-2 mr-1">Garant.:</span>
                                <span>{ordem.garantia_dias}d</span>
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* Section: CLIENTE */}
            <div className="text-center font-bold text-[11px] border-b border-black py-1 uppercase mb-2">
                CLIENTE
            </div>
            <div className="flex flex-wrap items-baseline gap-1 mb-3">
                <span className="font-bold text-[12px]">{ordem.cliente?.name || 'Não informado'}</span>
                <span className="font-bold text-[11px]"> | Tel: </span>
                <span className="text-[11px] border-b border-dashed border-red-500 text-red-600">{ordem.cliente?.phone_primary}</span>
            </div>

            {/* Section: EQUIPAMENTO */}
            <div className="text-center font-bold text-[11px] border-b border-black py-1 uppercase mb-2">
                EQUIPAMENTO
            </div>
            <div className="text-center font-bold text-[11px] mb-3 italic">
                {ordem.equipamento_tipo || 'Equipamento não informado'}
                {ordem.equipamento_marca && <span> - Marca: {ordem.equipamento_marca}</span>}
                {ordem.equipamento_modelo && <span> - Mod: {ordem.equipamento_modelo}</span>}
                {ordem.equipamento_serie && <span> - S/N: {ordem.equipamento_serie}</span>}
            </div>
            {(ordem.equipamento_acessorios || ordem.equipamento_estado) && (
                <div className="text-[9px] mb-3 border border-dashed border-gray-300 p-1">
                    {ordem.equipamento_acessorios && <div><span className="font-bold">Acessórios:</span> {ordem.equipamento_acessorios}</div>}
                    {ordem.equipamento_estado && <div><span className="font-bold">Estado:</span> {ordem.equipamento_estado}</div>}
                </div>
            )}

            {/* Section: SERVIÇO/DEFEITO */}
            <div className="font-bold text-[11px] text-justify mb-3 whitespace-pre-wrap">
                <div className="mb-1 border-b border-dashed border-gray-300 pb-1">{ordem.tipo_servico || 'Tipo de serviço não informado'}</div>
                {(ordem.formatacao_so || ordem.formatacao_backup !== undefined || ordem.formatacao_senha) && (
                    <div className="text-[10px] mb-2 p-1 bg-gray-50 border border-gray-200 font-normal">
                        {ordem.formatacao_so && <div><span className="font-bold">S.O.:</span> {ordem.formatacao_so}</div>}
                        {ordem.formatacao_backup !== undefined && (
                            <div className="mt-1">
                                <span className="font-bold">Backup:</span> {ordem.formatacao_backup ? 'Sim' : 'Não'}
                                {ordem.formatacao_backup && (
                                    <div className="mt-1 pl-2 border-l-2 border-black/20 text-[9px] italic">
                                        <div className="font-bold not-italic underline uppercase text-[8px]">O que deve ser salvo no Backup?</div>
                                        <div>{ordem.formatacao_backup_descricao || 'Não informado'}</div>
                                    </div>
                                )}
                            </div>
                        )}
                        {ordem.formatacao_senha && <div className="mt-1"><span className="font-bold">Senha do Equipamento:</span> {ordem.formatacao_senha}</div>}
                    </div>
                )}
                <div className="font-normal">{stripHtml(ordem.descricao)}</div>
            </div>

            {/* Section: ITENS/SERVIÇOS */}
            <div className="text-center font-bold text-[11px] border-b border-black py-1 uppercase mb-2">
                ITENS/SERVIÇOS
            </div>
            {ordem.itens && ordem.itens.length > 0 ? (
                <div className="mb-3">
                    <div className="flex font-bold text-[9px] border-b border-black mb-1">
                        <span className="w-4">#</span>
                        <span className="flex-1">DESCRIÇÃO</span>
                        <span className="w-8 text-center">QTD</span>
                        <span className="w-16 text-right">VL. UNIT</span>
                        <span className="w-16 text-right">VL. TOTAL</span>
                    </div>
                    {ordem.itens.map((item: any, index: number) => (
                        <div key={index} className="flex flex-col mb-2 text-[9px]">
                            <div className="flex">
                                <span className="w-4">{(index + 1).toString().padStart(3, '0')}</span>
                                <span className="flex-1 font-bold whitespace-pre-wrap">{item.descricao}</span>
                            </div>
                            <div className="flex justify-end gap-2">
                                <span className="w-8 text-center">{item.quantidade} Un</span>
                                <span className="w-16 text-right">{formatCurrency(item.valor_unitario).replace('R$', '').trim()}</span>
                                <span className="w-16 text-right">{formatCurrency(item.valor_total).replace('R$', '').trim()}</span>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center text-gray-500 italic mb-2">Nenhum item cadastrado</div>
            )}

            {/* Pagamento e QR Code */}
            <div className="border-t border-black pt-2 mb-4">
                <div className="flex justify-between font-bold">
                    <span>Valor a Pagar R$</span>
                    <span>{formatCurrency(ordem.valor_servico).replace('R$', '').trim()}</span>
                </div>
                <div className="flex justify-between text-[10px] mt-1">
                    <div className="flex flex-col">
                        <span className="uppercase font-bold">FORMA DE PAGAMENTO</span>
                        <span>Cartão de Crédito</span>
                    </div>
                    <div className="flex flex-col items-end">
                        <span className="uppercase font-bold">VALOR PAGO R$</span>
                        <span>{formatCurrency(ordem.valor_servico).replace('R$', '').trim()}</span>
                    </div>
                </div>
            </div>

            <div className="text-[10px] mb-2 font-bold italic">
                Para fazer o pagamento, você poderá utilizar a chave pix, ou ler o qr code
            </div>

            <div className="flex items-center gap-4 mb-4">
                <div className="bg-white p-1 border border-black">
                    {/* Placeholder para QR Code PIX */}
                    <QRCodeSVG
                        value={ordem.chavePix || "Chave PIX não definida"}
                        size={90}
                        level="M"
                    />
                </div>
                <div className="flex-1">
                    <div className="font-bold text-[14px]">OS #{ordem.numero}</div>
                    <div className="font-bold text-[12px]">Valor da OS: {formatCurrency(ordem.valor_servico).replace('R$', '').trim()}</div>
                </div>
            </div>

            {/* Observações */}
            {stripHtml(ordem.observacoes_cliente) && (
                <div className="mt-4 border-t border-black pt-2">
                    <div className="font-bold text-[11px] mb-1 uppercase">Observações do Cliente</div>
                    <div className="text-[10px] italic whitespace-pre-wrap">{stripHtml(ordem.observacoes_cliente)}</div>
                </div>
            )}



            {/* Rodapé decorativo no print do navegador */}
            <style dangerouslySetInnerHTML={{
                __html: `
        @media print {
          .thermal-container {
            width: 80mm !important;
            margin: 0 !important;
            padding: 5mm !important;
            border: none !important;
          }
        }
      `}} />
        </div>
    );
};
