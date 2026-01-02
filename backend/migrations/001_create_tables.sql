-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION: Criação das tabelas do módulo ordem_servico
-- Versão: 1.0.0
-- Data: 2025-12-30
-- ═══════════════════════════════════════════════════════════════════════════

-- Tabela de configurações do módulo
CREATE TABLE IF NOT EXISTS mod_ordem_servico_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id TEXT NOT NULL,
    key VARCHAR(255) NOT NULL,
    value TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_mod_ordem_servico_configs_tenant FOREIGN KEY (tenant_id)
        REFERENCES tenants(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_mod_ordem_servico_configs_tenant_id ON mod_ordem_servico_configs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_mod_ordem_servico_configs_key ON mod_ordem_servico_configs(key);
