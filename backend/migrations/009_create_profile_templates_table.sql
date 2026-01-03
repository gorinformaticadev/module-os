-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION: Criação da tabela de templates de perfis
-- Versão: 1.0.0
-- Data: 2026-01-02
-- ═══════════════════════════════════════════════════════════════════════════

-- Tabela de templates de perfis (para facilitar configuração)
CREATE TABLE IF NOT EXISTS mod_ordem_servico_profile_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL,
    description TEXT,
    is_system BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT uk_profile_templates_name UNIQUE (name)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_profile_templates_name ON mod_ordem_servico_profile_templates(name);
CREATE INDEX IF NOT EXISTS idx_profile_templates_system ON mod_ordem_servico_profile_templates(is_system);