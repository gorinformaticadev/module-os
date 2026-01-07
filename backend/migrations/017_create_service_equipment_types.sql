-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION: Criação das tabelas de tipos de serviço e equipamento
-- Versão: 1.0.0
-- Data: 2026-01-07
-- ═══════════════════════════════════════════════════════════════════════════

-- Tabela de tipos de serviço
CREATE TABLE IF NOT EXISTS mod_ordem_servico_tipos_servico (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id TEXT NOT NULL,
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    is_default BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_mod_ordem_servico_tipos_servico_tenant FOREIGN KEY (tenant_id)
        REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Unique constraint para nome por tenant
    CONSTRAINT uk_mod_ordem_servico_tipos_servico_nome UNIQUE (tenant_id, nome)
);

-- Tabela de tipos de equipamento
CREATE TABLE IF NOT EXISTS mod_ordem_servico_tipos_equipamento (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id TEXT NOT NULL,
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_mod_ordem_servico_tipos_equipamento_tenant FOREIGN KEY (tenant_id)
        REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Unique constraint para nome por tenant
    CONSTRAINT uk_mod_ordem_servico_tipos_equipamento_nome UNIQUE (tenant_id, nome)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_mod_ordem_servico_tipos_servico_tenant_id ON mod_ordem_servico_tipos_servico(tenant_id);
CREATE INDEX IF NOT EXISTS idx_mod_ordem_servico_tipos_servico_nome ON mod_ordem_servico_tipos_servico(nome);
CREATE INDEX IF NOT EXISTS idx_mod_ordem_servico_tipos_servico_active ON mod_ordem_servico_tipos_servico(is_active);

CREATE INDEX IF NOT EXISTS idx_mod_ordem_servico_tipos_equipamento_tenant_id ON mod_ordem_servico_tipos_equipamento(tenant_id);
CREATE INDEX IF NOT EXISTS idx_mod_ordem_servico_tipos_equipamento_nome ON mod_ordem_servico_tipos_equipamento(nome);
CREATE INDEX IF NOT EXISTS idx_mod_ordem_servico_tipos_equipamento_active ON mod_ordem_servico_tipos_equipamento(is_active);

-- Comentários nas tabelas
COMMENT ON TABLE mod_ordem_servico_tipos_servico IS 'Tipos de serviço disponíveis para ordens de serviço';
COMMENT ON COLUMN mod_ordem_servico_tipos_servico.is_default IS 'Indica se é um tipo padrão que não pode ser excluído';
COMMENT ON COLUMN mod_ordem_servico_tipos_servico.is_active IS 'Indica se o tipo está ativo para uso';

COMMENT ON TABLE mod_ordem_servico_tipos_equipamento IS 'Tipos de equipamento disponíveis para ordens de serviço';
COMMENT ON COLUMN mod_ordem_servico_tipos_equipamento.is_active IS 'Indica se o tipo está ativo para uso';

-- Triggers para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_mod_ordem_servico_tipos_servico_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_mod_ordem_servico_tipos_servico_updated_at
    BEFORE UPDATE ON mod_ordem_servico_tipos_servico
    FOR EACH ROW
    EXECUTE FUNCTION update_mod_ordem_servico_tipos_servico_updated_at();

CREATE OR REPLACE FUNCTION update_mod_ordem_servico_tipos_equipamento_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_mod_ordem_servico_tipos_equipamento_updated_at
    BEFORE UPDATE ON mod_ordem_servico_tipos_equipamento
    FOR EACH ROW
    EXECUTE FUNCTION update_mod_ordem_servico_tipos_equipamento_updated_at();

-- Inserir dados padrão para tipos de serviço (não podem ser excluídos)
INSERT INTO mod_ordem_servico_tipos_servico (tenant_id, nome, descricao, is_default, is_active)
SELECT 
    t.id as tenant_id,
    'Formatação' as nome,
    'Formatação completa do sistema operacional' as descricao,
    true as is_default,
    true as is_active
FROM tenants t
WHERE NOT EXISTS (
    SELECT 1 FROM mod_ordem_servico_tipos_servico 
    WHERE tenant_id = t.id AND nome = 'Formatação'
);

INSERT INTO mod_ordem_servico_tipos_servico (tenant_id, nome, descricao, is_default, is_active)
SELECT 
    t.id as tenant_id,
    'Manutenção' as nome,
    'Manutenção preventiva e corretiva' as descricao,
    true as is_default,
    true as is_active
FROM tenants t
WHERE NOT EXISTS (
    SELECT 1 FROM mod_ordem_servico_tipos_servico 
    WHERE tenant_id = t.id AND nome = 'Manutenção'
);

INSERT INTO mod_ordem_servico_tipos_servico (tenant_id, nome, descricao, is_default, is_active)
SELECT 
    t.id as tenant_id,
    'Suporte Técnico' as nome,
    'Suporte técnico especializado' as descricao,
    true as is_default,
    true as is_active
FROM tenants t
WHERE NOT EXISTS (
    SELECT 1 FROM mod_ordem_servico_tipos_servico 
    WHERE tenant_id = t.id AND nome = 'Suporte Técnico'
);

INSERT INTO mod_ordem_servico_tipos_servico (tenant_id, nome, descricao, is_default, is_active)
SELECT 
    t.id as tenant_id,
    'Outros' as nome,
    'Outros tipos de serviços' as descricao,
    true as is_default,
    true as is_active
FROM tenants t
WHERE NOT EXISTS (
    SELECT 1 FROM mod_ordem_servico_tipos_servico 
    WHERE tenant_id = t.id AND nome = 'Outros'
);

-- Inserir dados padrão para tipos de equipamento (podem ser modificados/excluídos)
INSERT INTO mod_ordem_servico_tipos_equipamento (tenant_id, nome, descricao, is_active)
SELECT 
    t.id as tenant_id,
    'Desktop' as nome,
    'Computador de mesa' as descricao,
    true as is_active
FROM tenants t
WHERE NOT EXISTS (
    SELECT 1 FROM mod_ordem_servico_tipos_equipamento 
    WHERE tenant_id = t.id AND nome = 'Desktop'
);

INSERT INTO mod_ordem_servico_tipos_equipamento (tenant_id, nome, descricao, is_active)
SELECT 
    t.id as tenant_id,
    'Notebook' as nome,
    'Computador portátil' as descricao,
    true as is_active
FROM tenants t
WHERE NOT EXISTS (
    SELECT 1 FROM mod_ordem_servico_tipos_equipamento 
    WHERE tenant_id = t.id AND nome = 'Notebook'
);

INSERT INTO mod_ordem_servico_tipos_equipamento (tenant_id, nome, descricao, is_active)
SELECT 
    t.id as tenant_id,
    'Celular' as nome,
    'Telefone celular/smartphone' as descricao,
    true as is_active
FROM tenants t
WHERE NOT EXISTS (
    SELECT 1 FROM mod_ordem_servico_tipos_equipamento 
    WHERE tenant_id = t.id AND nome = 'Celular'
);

INSERT INTO mod_ordem_servico_tipos_equipamento (tenant_id, nome, descricao, is_active)
SELECT 
    t.id as tenant_id,
    'Tablet' as nome,
    'Tablet/iPad' as descricao,
    true as is_active
FROM tenants t
WHERE NOT EXISTS (
    SELECT 1 FROM mod_ordem_servico_tipos_equipamento 
    WHERE tenant_id = t.id AND nome = 'Tablet'
);

INSERT INTO mod_ordem_servico_tipos_equipamento (tenant_id, nome, descricao, is_active)
SELECT 
    t.id as tenant_id,
    'All-in-One' as nome,
    'Computador tudo-em-um' as descricao,
    true as is_active
FROM tenants t
WHERE NOT EXISTS (
    SELECT 1 FROM mod_ordem_servico_tipos_equipamento 
    WHERE tenant_id = t.id AND nome = 'All-in-One'
);

INSERT INTO mod_ordem_servico_tipos_equipamento (tenant_id, nome, descricao, is_active)
SELECT 
    t.id as tenant_id,
    'Monitor' as nome,
    'Monitor de vídeo' as descricao,
    true as is_active
FROM tenants t
WHERE NOT EXISTS (
    SELECT 1 FROM mod_ordem_servico_tipos_equipamento 
    WHERE tenant_id = t.id AND nome = 'Monitor'
);

INSERT INTO mod_ordem_servico_tipos_equipamento (tenant_id, nome, descricao, is_active)
SELECT 
    t.id as tenant_id,
    'Impressora' as nome,
    'Impressora/multifuncional' as descricao,
    true as is_active
FROM tenants t
WHERE NOT EXISTS (
    SELECT 1 FROM mod_ordem_servico_tipos_equipamento 
    WHERE tenant_id = t.id AND nome = 'Impressora'
);

INSERT INTO mod_ordem_servico_tipos_equipamento (tenant_id, nome, descricao, is_active)
SELECT 
    t.id as tenant_id,
    'Outros' as nome,
    'Outros tipos de equipamentos' as descricao,
    true as is_active
FROM tenants t
WHERE NOT EXISTS (
    SELECT 1 FROM mod_ordem_servico_tipos_equipamento 
    WHERE tenant_id = t.id AND nome = 'Outros'
);