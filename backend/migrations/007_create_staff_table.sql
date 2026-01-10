-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION: Criação da tabela de staff do módulo ordem_servico
-- Versão: 1.0.0
-- Data: 2026-01-02
-- ═══════════════════════════════════════════════════════════════════════════

-- Tabela de staff/funcionários do módulo
CREATE TABLE IF NOT EXISTS mod_ordem_servico_staff (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    is_technician BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_mod_ordem_servico_staff_tenant FOREIGN KEY (tenant_id)
        REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Unique constraint to prevent duplicate user entries per tenant
    CONSTRAINT uk_mod_ordem_servico_staff_user_tenant UNIQUE (tenant_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_mod_ordem_servico_staff_tenant_id ON mod_ordem_servico_staff(tenant_id);
CREATE INDEX IF NOT EXISTS idx_mod_ordem_servico_staff_user_id ON mod_ordem_servico_staff(user_id);