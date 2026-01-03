-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION: Criação da tabela de permissões dos templates
-- Versão: 1.0.0
-- Data: 2026-01-02
-- ═══════════════════════════════════════════════════════════════════════════

-- Tabela de permissões dos templates
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

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_template_permissions_template_id ON mod_ordem_servico_template_permissions(template_id);
CREATE INDEX IF NOT EXISTS idx_template_permissions_resource ON mod_ordem_servico_template_permissions(resource);