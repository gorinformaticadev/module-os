-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION: Criação da tabela de auditoria de permissões
-- Versão: 1.0.0
-- Data: 2026-01-02
-- ═══════════════════════════════════════════════════════════════════════════

-- Tabela de auditoria de alterações de permissões
CREATE TABLE IF NOT EXISTS mod_ordem_servico_permission_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    resource VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    old_value BOOLEAN,
    new_value BOOLEAN NOT NULL,
    changed_by TEXT NOT NULL,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reason TEXT,
    
    CONSTRAINT fk_permission_audit_tenant FOREIGN KEY (tenant_id)
        REFERENCES tenants(id) ON DELETE CASCADE
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_permission_audit_tenant_id ON mod_ordem_servico_permission_audit(tenant_id);
CREATE INDEX IF NOT EXISTS idx_permission_audit_user_id ON mod_ordem_servico_permission_audit(user_id);
CREATE INDEX IF NOT EXISTS idx_permission_audit_changed_at ON mod_ordem_servico_permission_audit(changed_at);
CREATE INDEX IF NOT EXISTS idx_permission_audit_tenant_user ON mod_ordem_servico_permission_audit(tenant_id, user_id);