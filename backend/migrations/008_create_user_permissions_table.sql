-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION: Criação da tabela de permissões individuais de usuários
-- Versão: 1.0.0
-- Data: 2026-01-02
-- ═══════════════════════════════════════════════════════════════════════════

-- Tabela de permissões individuais de usuários
CREATE TABLE IF NOT EXISTS mod_ordem_servico_user_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    resource VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    allowed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by TEXT NOT NULL,
    
    CONSTRAINT fk_user_permissions_tenant FOREIGN KEY (tenant_id)
        REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT uk_user_permissions UNIQUE (tenant_id, user_id, resource, action)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_user_permissions_tenant_id ON mod_ordem_servico_user_permissions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_user_id ON mod_ordem_servico_user_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_resource ON mod_ordem_servico_user_permissions(resource);
CREATE INDEX IF NOT EXISTS idx_user_permissions_tenant_user ON mod_ordem_servico_user_permissions(tenant_id, user_id);