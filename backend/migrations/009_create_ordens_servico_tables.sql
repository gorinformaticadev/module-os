-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION: Criação das tabelas do sistema de Ordens de Serviço
-- Versão: 1.0.0
-- Data: 2026-01-03
-- ═══════════════════════════════════════════════════════════════════════════

-- Tabela principal de Ordens de Serviço
CREATE TABLE IF NOT EXISTS mod_ordem_servico_ordens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id TEXT NOT NULL,
    numero TEXT NOT NULL,
    cliente_id UUID NOT NULL,
    usuario_responsavel_id TEXT NOT NULL,
    tipo_servico TEXT NOT NULL,
    descricao TEXT NOT NULL,
    observacoes_internas TEXT,
    valor_servico DECIMAL(10,2) DEFAULT 0.00,
    forma_pagamento TEXT,
    status INTEGER NOT NULL DEFAULT 0 CHECK (status >= 0 AND status <= 7),
    data_abertura TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_previsao TIMESTAMP,
    data_conclusao TIMESTAMP,
    origem_solicitacao TEXT NOT NULL CHECK (origem_solicitacao IN ('WHATSAPP', 'PRESENCIAL', 'SISTEMA')),
    orcamento_aprovado BOOLEAN DEFAULT FALSE,
    motivo_cancelamento TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_mod_ordem_servico_ordens_tenant FOREIGN KEY (tenant_id)
        REFERENCES tenants(id) ON DELETE CASCADE,
    
    CONSTRAINT fk_mod_ordem_servico_ordens_cliente FOREIGN KEY (cliente_id)
        REFERENCES mod_ordem_servico_clients(id) ON DELETE RESTRICT,
    
    -- Unique constraint para número da OS por tenant
    CONSTRAINT uk_mod_ordem_servico_ordens_numero UNIQUE (tenant_id, numero)
);

-- Tabela de histórico das Ordens de Serviço
CREATE TABLE IF NOT EXISTS mod_ordem_servico_historico (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id TEXT NOT NULL,
    ordem_servico_id UUID NOT NULL,
    usuario_id TEXT NOT NULL,
    acao TEXT NOT NULL,
    valor_anterior TEXT,
    valor_novo TEXT,
    observacoes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_mod_ordem_servico_historico_tenant FOREIGN KEY (tenant_id)
        REFERENCES tenants(id) ON DELETE CASCADE,
    
    CONSTRAINT fk_mod_ordem_servico_historico_ordem FOREIGN KEY (ordem_servico_id)
        REFERENCES mod_ordem_servico_ordens(id) ON DELETE CASCADE
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_mod_ordem_servico_ordens_tenant_id ON mod_ordem_servico_ordens(tenant_id);
CREATE INDEX IF NOT EXISTS idx_mod_ordem_servico_ordens_cliente_id ON mod_ordem_servico_ordens(cliente_id);
CREATE INDEX IF NOT EXISTS idx_mod_ordem_servico_ordens_status ON mod_ordem_servico_ordens(status);
CREATE INDEX IF NOT EXISTS idx_mod_ordem_servico_ordens_data_abertura ON mod_ordem_servico_ordens(data_abertura);
CREATE INDEX IF NOT EXISTS idx_mod_ordem_servico_ordens_numero ON mod_ordem_servico_ordens(numero);
CREATE INDEX IF NOT EXISTS idx_mod_ordem_servico_ordens_usuario_responsavel ON mod_ordem_servico_ordens(usuario_responsavel_id);

CREATE INDEX IF NOT EXISTS idx_mod_ordem_servico_historico_tenant_id ON mod_ordem_servico_historico(tenant_id);
CREATE INDEX IF NOT EXISTS idx_mod_ordem_servico_historico_ordem_id ON mod_ordem_servico_historico(ordem_servico_id);
CREATE INDEX IF NOT EXISTS idx_mod_ordem_servico_historico_usuario_id ON mod_ordem_servico_historico(usuario_id);
CREATE INDEX IF NOT EXISTS idx_mod_ordem_servico_historico_created_at ON mod_ordem_servico_historico(created_at);

-- Comentários nas tabelas
COMMENT ON TABLE mod_ordem_servico_ordens IS 'Tabela principal das Ordens de Serviço';
COMMENT ON COLUMN mod_ordem_servico_ordens.status IS 'Status: 0=Orçamento, 1=Aberta, 2=Em Análise, 3=Aguardando Cliente, 4=Aguardando Peças, 5=Em Execução, 6=Finalizada, 7=Cancelada';
COMMENT ON COLUMN mod_ordem_servico_ordens.origem_solicitacao IS 'Origem da solicitação: WHATSAPP, PRESENCIAL, SISTEMA';
COMMENT ON COLUMN mod_ordem_servico_ordens.orcamento_aprovado IS 'Indica se o orçamento foi aprovado pelo cliente';

COMMENT ON TABLE mod_ordem_servico_historico IS 'Histórico de alterações das Ordens de Serviço';
COMMENT ON COLUMN mod_ordem_servico_historico.acao IS 'Tipo de ação: CRIACAO, EDICAO, MUDANCA_STATUS, FINALIZACAO, CANCELAMENTO, APROVACAO_ORCAMENTO';

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_mod_ordem_servico_ordens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_mod_ordem_servico_ordens_updated_at
    BEFORE UPDATE ON mod_ordem_servico_ordens
    FOR EACH ROW
    EXECUTE FUNCTION update_mod_ordem_servico_ordens_updated_at();