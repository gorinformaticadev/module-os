-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION: Criação simplificada das tabelas de tipos de serviço e equipamento
-- Versão: 2.0.0 (Simplificada)
-- Data: 2026-01-07
-- ═══════════════════════════════════════════════════════════════════════════

-- Remover tabelas antigas se existirem
DROP TABLE IF EXISTS mod_ordem_servico_tipos_servico CASCADE;
DROP TABLE IF EXISTS mod_ordem_servico_tipos_equipamento CASCADE;

-- Tabela simples de tipos de serviço
CREATE TABLE IF NOT EXISTS mod_ordem_servico_tipos_servico (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id TEXT NOT NULL,
    nome VARCHAR(255) NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_mod_ordem_servico_tipos_servico_tenant FOREIGN KEY (tenant_id)
        REFERENCES tenants(id) ON DELETE CASCADE,
    
    CONSTRAINT uk_mod_ordem_servico_tipos_servico_nome UNIQUE (tenant_id, nome)
);

-- Tabela simples de tipos de equipamento
CREATE TABLE IF NOT EXISTS mod_ordem_servico_tipos_equipamento (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id TEXT NOT NULL,
    nome VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_mod_ordem_servico_tipos_equipamento_tenant FOREIGN KEY (tenant_id)
        REFERENCES tenants(id) ON DELETE CASCADE,
    
    CONSTRAINT uk_mod_ordem_servico_tipos_equipamento_nome UNIQUE (tenant_id, nome)
);

-- Índices básicos
CREATE INDEX IF NOT EXISTS idx_mod_ordem_servico_tipos_servico_tenant_id ON mod_ordem_servico_tipos_servico(tenant_id);
CREATE INDEX IF NOT EXISTS idx_mod_ordem_servico_tipos_equipamento_tenant_id ON mod_ordem_servico_tipos_equipamento(tenant_id);

-- Inserir dados padrão para tipos de serviço (não podem ser excluídos)
INSERT INTO mod_ordem_servico_tipos_servico (tenant_id, nome, is_default)
SELECT 
    t.id as tenant_id,
    'Formatação' as nome,
    true as is_default
FROM tenants t
WHERE NOT EXISTS (
    SELECT 1 FROM mod_ordem_servico_tipos_servico 
    WHERE tenant_id = t.id AND nome = 'Formatação'
);

INSERT INTO mod_ordem_servico_tipos_servico (tenant_id, nome, is_default)
SELECT 
    t.id as tenant_id,
    'Manutenção' as nome,
    true as is_default
FROM tenants t
WHERE NOT EXISTS (
    SELECT 1 FROM mod_ordem_servico_tipos_servico 
    WHERE tenant_id = t.id AND nome = 'Manutenção'
);

INSERT INTO mod_ordem_servico_tipos_servico (tenant_id, nome, is_default)
SELECT 
    t.id as tenant_id,
    'Suporte Técnico' as nome,
    true as is_default
FROM tenants t
WHERE NOT EXISTS (
    SELECT 1 FROM mod_ordem_servico_tipos_servico 
    WHERE tenant_id = t.id AND nome = 'Suporte Técnico'
);

INSERT INTO mod_ordem_servico_tipos_servico (tenant_id, nome, is_default)
SELECT 
    t.id as tenant_id,
    'Outros' as nome,
    true as is_default
FROM tenants t
WHERE NOT EXISTS (
    SELECT 1 FROM mod_ordem_servico_tipos_servico 
    WHERE tenant_id = t.id AND nome = 'Outros'
);

-- Inserir dados padrão para tipos de equipamento (podem ser modificados/excluídos)
INSERT INTO mod_ordem_servico_tipos_equipamento (tenant_id, nome)
SELECT 
    t.id as tenant_id,
    'Desktop' as nome
FROM tenants t
WHERE NOT EXISTS (
    SELECT 1 FROM mod_ordem_servico_tipos_equipamento 
    WHERE tenant_id = t.id AND nome = 'Desktop'
);

INSERT INTO mod_ordem_servico_tipos_equipamento (tenant_id, nome)
SELECT 
    t.id as tenant_id,
    'Notebook' as nome
FROM tenants t
WHERE NOT EXISTS (
    SELECT 1 FROM mod_ordem_servico_tipos_equipamento 
    WHERE tenant_id = t.id AND nome = 'Notebook'
);

INSERT INTO mod_ordem_servico_tipos_equipamento (tenant_id, nome)
SELECT 
    t.id as tenant_id,
    'Celular' as nome
FROM tenants t
WHERE NOT EXISTS (
    SELECT 1 FROM mod_ordem_servico_tipos_equipamento 
    WHERE tenant_id = t.id AND nome = 'Celular'
);

INSERT INTO mod_ordem_servico_tipos_equipamento (tenant_id, nome)
SELECT 
    t.id as tenant_id,
    'Tablet' as nome
FROM tenants t
WHERE NOT EXISTS (
    SELECT 1 FROM mod_ordem_servico_tipos_equipamento 
    WHERE tenant_id = t.id AND nome = 'Tablet'
);

INSERT INTO mod_ordem_servico_tipos_equipamento (tenant_id, nome)
SELECT 
    t.id as tenant_id,
    'All-in-One' as nome
FROM tenants t
WHERE NOT EXISTS (
    SELECT 1 FROM mod_ordem_servico_tipos_equipamento 
    WHERE tenant_id = t.id AND nome = 'All-in-One'
);

INSERT INTO mod_ordem_servico_tipos_equipamento (tenant_id, nome)
SELECT 
    t.id as tenant_id,
    'Monitor' as nome
FROM tenants t
WHERE NOT EXISTS (
    SELECT 1 FROM mod_ordem_servico_tipos_equipamento 
    WHERE tenant_id = t.id AND nome = 'Monitor'
);

INSERT INTO mod_ordem_servico_tipos_equipamento (tenant_id, nome)
SELECT 
    t.id as tenant_id,
    'Impressora' as nome
FROM tenants t
WHERE NOT EXISTS (
    SELECT 1 FROM mod_ordem_servico_tipos_equipamento 
    WHERE tenant_id = t.id AND nome = 'Impressora'
);

INSERT INTO mod_ordem_servico_tipos_equipamento (tenant_id, nome)
SELECT 
    t.id as tenant_id,
    'Outros' as nome
FROM tenants t
WHERE NOT EXISTS (
    SELECT 1 FROM mod_ordem_servico_tipos_equipamento 
    WHERE tenant_id = t.id AND nome = 'Outros'
);