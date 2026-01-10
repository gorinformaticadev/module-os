-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION: Tabela de Produtos/Serviços do Módulo Ordem de Serviço
-- Data: 2025-12-31
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS mod_ordem_servico_products (
    id UUID PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_mod_ordem_servico_products_tenant_id ON mod_ordem_servico_products(tenant_id);
CREATE INDEX IF NOT EXISTS idx_mod_ordem_servico_products_code ON mod_ordem_servico_products(code);
CREATE INDEX IF NOT EXISTS idx_mod_ordem_servico_products_name ON mod_ordem_servico_products(name);

-- Unique index for code per tenant (ignoring deleted)
CREATE UNIQUE INDEX IF NOT EXISTS idx_mod_ordem_servico_products_unique_code 
ON mod_ordem_servico_products(tenant_id, code) 
WHERE deleted_at IS NULL;
