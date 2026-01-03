-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION: Sistema Completo de Permissões Granulares
-- Versão: 1.0.0
-- Data: 2026-01-03
-- Descrição: Cria todas as tabelas necessárias para o sistema de permissões
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Tabela de permissões individuais de usuários
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

-- 2. Tabela de templates de perfis
CREATE TABLE IF NOT EXISTS mod_ordem_servico_profile_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL,
    description TEXT,
    is_system BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT uk_profile_templates_name UNIQUE (name)
);

-- 3. Tabela de permissões dos templates
CREATE TABLE IF NOT EXISTS mod_ordem_servico_template_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL,
    resource VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    allowed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_template_permissions_template FOREIGN KEY (template_id)
        REFERENCES mod_ordem_servico_profile_templates(id) ON DELETE CASCADE,
    CONSTRAINT uk_template_permissions UNIQUE (template_id, resource, action)
);

-- 4. Tabela de auditoria de alterações de permissões
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

-- ═══════════════════════════════════════════════════════════════════════════
-- ÍNDICES PARA PERFORMANCE
-- ═══════════════════════════════════════════════════════════════════════════

-- Índices para mod_ordem_servico_user_permissions
CREATE INDEX IF NOT EXISTS idx_user_permissions_tenant_id ON mod_ordem_servico_user_permissions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_user_id ON mod_ordem_servico_user_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_resource ON mod_ordem_servico_user_permissions(resource);
CREATE INDEX IF NOT EXISTS idx_user_permissions_tenant_user ON mod_ordem_servico_user_permissions(tenant_id, user_id);

-- Índices para mod_ordem_servico_profile_templates
CREATE INDEX IF NOT EXISTS idx_profile_templates_name ON mod_ordem_servico_profile_templates(name);
CREATE INDEX IF NOT EXISTS idx_profile_templates_system ON mod_ordem_servico_profile_templates(is_system);

-- Índices para mod_ordem_servico_template_permissions
CREATE INDEX IF NOT EXISTS idx_template_permissions_template_id ON mod_ordem_servico_template_permissions(template_id);
CREATE INDEX IF NOT EXISTS idx_template_permissions_resource ON mod_ordem_servico_template_permissions(resource);

-- Índices para mod_ordem_servico_permission_audit
CREATE INDEX IF NOT EXISTS idx_permission_audit_tenant_id ON mod_ordem_servico_permission_audit(tenant_id);
CREATE INDEX IF NOT EXISTS idx_permission_audit_user_id ON mod_ordem_servico_permission_audit(user_id);
CREATE INDEX IF NOT EXISTS idx_permission_audit_changed_at ON mod_ordem_servico_permission_audit(changed_at);
CREATE INDEX IF NOT EXISTS idx_permission_audit_tenant_user ON mod_ordem_servico_permission_audit(tenant_id, user_id);