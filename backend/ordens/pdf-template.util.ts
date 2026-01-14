
export const generatePdfHtml = (ordem: any, tenantInfo: any) => {
    const formatDate = (dateString: string) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR');
    };

    const formatDateTime = (dateString: string) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return `${date.toLocaleDateString('pt-BR')} ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}`;
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

    // Helper para gerar o conteúdo da OS
    const generateCopy = () => {
        return `
        <div class="single-copy-wrapper">
            <!-- Header -->
            <div class="header-box">
                <div class="logo-section">
                    ${tenantInfo.logo_url ? `<img src="${tenantInfo.logo_url}" alt="Logo" />` : '<div style="font-size: 11px; color: #ccc; font-weight: 600;">LOGO</div>'}
                </div>
                <div class="company-data">
                    <div class="company-name">${tenantInfo.name || ''}</div>
                    <div class="company-info">
                        ${tenantInfo.document ? `<div>CNPJ: ${formatCpfCnpj(tenantInfo.document)}</div>` : ''}
                        ${tenantInfo.address ? `<div>${tenantInfo.address}</div>` : ''}
                    </div>
                </div>
                <div class="contact-section">
                    ${tenantInfo.phone ? `<div><strong>Tel:</strong> ${tenantInfo.phone}</div>` : ''}
                    ${tenantInfo.email ? `<div>${tenantInfo.email}</div>` : ''}
                </div>
            </div>

            <!-- Título da OS -->
            <div class="os-title-bar">
                <div class="os-title">ORDEM DE SERVIÇO #${ordem.numero}</div>
                <div class="os-emission">Emissão: ${formatDateTime(ordem.data_abertura)}</div>
            </div>

            <!-- Tabela de Informações -->
            <table class="info-table">
                <thead>
                    <tr>
                        <th>Status</th>
                        <th>Data Inicial</th>
                        <th>Data Prevista</th>
                        <th>Garantia</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>${getStatusLabel(ordem.status)}</td>
                        <td>${formatDate(ordem.data_abertura)}</td>
                        <td>${formatDate(ordem.data_previsao)}</td>
                        <td>${ordem.garantia_dias ? `${ordem.garantia_dias} dia(s)` : '-'}</td>
                    </tr>
                </tbody>
            </table>

            <!-- Dados do Cliente -->
            ${ordem.cliente ? `
                <div class="section-header">Dados do Cliente</div>
                <div class="section-content">
                    <strong>Nome:</strong> ${ordem.cliente.name || ''} 
                    | <strong>Telefone:</strong> ${ordem.cliente.phone_primary || ''}
                    ${ordem.cliente.email ? `| <strong>Email:</strong> ${ordem.cliente.email}` : ''}
                </div>
            ` : ''}

            <!-- Descrição Produto/Serviço -->
            <div class="section-header">Descrição Produto/Serviço</div>
            <div class="section-content">
                ${ordem.equipamento_tipo ? `
                    <strong>${ordem.equipamento_tipo}</strong>
                    ${ordem.equipamento_marca ? `<span> | <strong>Marca:</strong> ${ordem.equipamento_marca}</span>` : ''}
                    ${ordem.equipamento_modelo ? `<span> | <strong>Modelo:</strong> ${ordem.equipamento_modelo}</span>` : ''}
                    ${ordem.equipamento_serie ? `<span> | <strong>Série:</strong> ${ordem.equipamento_serie}</span>` : ''}
                ` : ''}
            </div>

            <!-- Defeito/Solicitação -->
            <div class="section-header">Defeito/Solicitação</div>
            <div class="section-content">
                ${(ordem.tipo_servico || ordem.formatacao_so || typeof ordem.formatacao_backup === 'boolean' || ordem.formatacao_senha) ? `
                    <div style="margin-bottom: 12px; font-weight: 600;">
                        ${ordem.tipo_servico || ''}
                        ${ordem.formatacao_so ? `<span> - ${ordem.formatacao_so}</span>` : ''}
                        ${typeof ordem.formatacao_backup === 'boolean' ? `<span> - Backup: ${ordem.formatacao_backup ? 'Sim' : 'Não'}</span>` : ''}
                        ${ordem.formatacao_backup && ordem.formatacao_backup_descricao ? `<span> (${ordem.formatacao_backup_descricao})</span>` : ''}
                        ${ordem.formatacao_senha ? `<span> - Senha: ${ordem.formatacao_senha}</span>` : ''}
                    </div>
                ` : ''}
                <div>${ordem.descricao || ''}</div>
            </div>

            <!-- Produtos/Serviços -->
            ${ordem.itens && ordem.itens.length > 0 ? `
                <div class="section-header">Produtos e Serviços</div>
                <table class="items-table">
                    <thead>
                        <tr>
                            <th>Descrição</th>
                            <th style="width: 70px; text-align: center;">Qtd</th>
                            <th style="width: 100px; text-align: right;">Valor Unit.</th>
                            <th style="width: 100px; text-align: right;">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${ordem.itens.map((item: any) => `
                            <tr>
                                <td>${item.descricao}</td>
                                <td style="text-align: center;">${item.quantidade}</td>
                                <td style="text-align: right;">${formatCurrency(item.valor_unitario)}</td>
                                <td style="text-align: right;">${formatCurrency(item.valor_total)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                    <tfoot>
                        <tr>
                            <td colspan="3" style="text-align: right;">VALOR TOTAL:</td>
                            <td style="text-align: right;">${formatCurrency(ordem.valor_servico)}</td>
                        </tr>
                    </tfoot>
                </table>
            ` : ''}

            <!-- Condições de Execução -->
            ${ordem.condicoesExecucao ? `
                <div class="section-header">Condições de Execução</div>
                <div class="section-content conditions-text">${ordem.condicoesExecucao}</div>
            ` : ''}

            <!-- Observações -->
            ${ordem.observacoes_cliente ? `
                <div class="section-header">Observações</div>
                <div class="section-content">${ordem.observacoes_cliente}</div>
            ` : ''}

            <!-- Assinaturas -->
            <div class="signatures">
                <div class="signature-box">
                    <div class="signature-line">
                        ${ordem.usuario_responsavel?.name || 'Atendente'}
                        <br />
                        <span style="font-size: 9px; color: #999;">Assinatura do Atendente</span>
                    </div>
                </div>
                <div class="signature-box">
                    <div class="signature-line">
                        ${ordem.cliente?.name || 'Cliente'}
                        <br />
                        <span style="font-size: 9px; color: #999;">Assinatura do Cliente</span>
                    </div>
                </div>
            </div>

            <!-- Rodapé com marca d'água -->
            <div class="footer-watermark">
                Sistema de Ordem de Serviço | Desenvolvido por: GOR Informática | ${new Date().getFullYear()} - ${formatDateTime(new Date().toISOString())}
            </div>
        </div>
        `;
    };

    return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
        <meta charset="UTF-8">
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap');

            @page {
                size: A4;
                margin: 0; /* Let print-container handle margins */
            }
            
            body {
                font-family: 'Roboto', Arial, sans-serif;
                font-size: 11pt;
                color: #000;
                background: white;
                margin: 0;
                padding: 0;
            }

            /* Container setup for A4 */
            .print-container {
                width: 100%;
                max-width: 210mm;
                margin: 0 auto;
                padding: 10mm;
                box-sizing: border-box;
            }

            /* Header com bordas sutis */
            .header-box {
                border: 1px solid #a1a1a1;
                padding: 10px;
                margin-bottom: 10px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-radius: 4px;
            }

            .logo-section {
                width: 140px;
                height: 70px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-right: 1px solid #e0e0e0;
                padding-right: 20px;
            }

            .logo-section img {
                max-width: 130px;
                max-height: 65px;
                object-fit: contain;
            }

            .company-data {
                flex: 1;
                padding: 0 20px;
                text-align: center;
            }

            .company-name {
                font-size: 16px;
                font-weight: bold;
                margin-bottom: 6px;
            }

            .company-info {
                font-size: 10px;
                color: #682525;
                line-height: 1.5;
            }

            .contact-section {
                text-align: right;
                font-size: 10px;
                color: #682525;
                min-width: 140px;
            }

            /* Título da OS */
            .os-title-bar {
                background: #d8d7d7;
                border: 1px solid #a5a5a5;
                border-radius: 4px;
                padding: 10px 15px;
                margin-bottom: 15px;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .os-title {
                font-size: 14px;
                font-weight: bold;
            }

            .os-emission {
                font-size: 10px;
                color: #666;
            }

            /* Tabela de informações */
            .info-table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 15px;
                border: 1px solid #a5a5a5;
                border-radius: 4px;
                overflow: hidden;
            }

            .info-table th {
                background: #f8f8f8;
                border: 1px solid #dfdede;
                padding: 8px 12px;
                font-size: 10px;
                font-weight: 600;
                color: #333;
                text-align: center;
                text-transform: uppercase;
                letter-spacing: 0.3px;
            }

            .info-table td {
                border: 1px solid #dfdede;
                padding: 8px 12px;
                font-size: 10px;
                text-align: center;
            }

            /* Seções */
            .section-header {
                background: #d8d7d7;
                border: 1px solid #a5a5a5;
                border-bottom: none;
                border-radius: 4px 4px 0 0;
                padding: 3px 12px;
                font-size: 10px;
                font-weight: 600;
                color: #333;
                margin-top: 10px;
                text-transform: uppercase;
                letter-spacing: 0.3px;
            }

            .section-content {
                border: 1px solid #e0e0e0;
                border-radius: 0 0 4px 4px;
                padding: 12px;
                font-size: 11px;
                line-height: 1.6;
                min-height: 30px;
            }

            /* Tabela de itens */
            .items-table {
                width: 100%;
                border-collapse: collapse;
                border: 1px solid #868585;
                border-radius: 0 0 4px 4px;
                overflow: hidden;
            }

            .items-table thead {
                background: #a39e9e;
                border-bottom: 1px solid #d0d0d0;
            }

            .items-table th {
                border: 1px solid #e0e0e0;
                padding: 8px 10px;
                font-size: 10px;
                font-weight: 600;
                color: #333;
                text-align: left;
                text-transform: uppercase;
                letter-spacing: 0.3px;
            }

            .items-table td {
                border: 1px solid #e0e0e0;
                padding: 8px 10px;
                font-size: 10px;
            }

            .items-table tfoot {
                background: #f5f5f5;
            }

            .items-table tfoot td {
                font-weight: 600;
                font-size: 11px;
                border-top: 2px solid #d0d0d0;
            }

            /* Assinaturas */
            .signatures {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 40px;
                margin-top: 40px;
                margin-bottom: 20px;
                page-break-inside: avoid;
            }

            .signature-box {
                text-align: center;
            }

            .signature-line {
                border-top: 1px solid #999;
                padding-top: 6px;
                margin-top: 40px;
                font-size: 10px;
                font-weight: 600;
                color: #666;
            }

            /* Rodapé com marca d'água */
            .footer-watermark {
                margin-top: 30px;
                border-top: 1px solid #e0e0e0;
                padding-top: 5px;
                text-align: right;
                font-size: 9px;
                color: #bbb;
            }

            /* Condições de execução compactas */
            .conditions-text {
                font-size: 10px !important;
                text-align: justify !important;
            }

            /* Utility */
            .single-copy-wrapper {
                position: relative;
                width: 100%;
            }
        </style>
    </head>
    <body>
        <div class="print-container">
            ${generateCopy()}
        </div>
    </body>
    </html>
    `;
};
