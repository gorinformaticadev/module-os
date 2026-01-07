-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION: Criação da tabela de papéis de usuários no módulo OS
-- Versão: 1.0.0
-- Data: 2026-01-07
-- ═══════════════════════════════════════════════════════════════════════════

-- Tabela para armazenar os papéis específicos dos usuários no módulo OS
CREATE TABLE IF NOT EXISTS mod_ordem_servico_user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    is_technician BOOLEAN DEFAULT FALSE,
    is_attendant BOOLEAN DEFAULT TRUE,
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_mod_ordem_servico_user_roles_tenant FOREIGN KEY (tenant_id)
        REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Unique constraint para um usuário por tenant
    CONSTRAINT uk_mod_ordem_servico_user_roles_user_tenant UNIQUE (tenant_id, user_id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_mod_ordem_servico_user_roles_tenant_id ON mod_ordem_servico_user_roles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_mod_ordem_servico_user_roles_user_id ON mod_ordem_servico_user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_mod_ordem_servico_user_roles_technician ON mod_ordem_servico_user_roles(is_technician);

-- Comentários na tabela
COMMENT ON TABLE mod_ordem_servico_user_roles IS 'Papéis específicos dos usuários no módulo de Ordem de Serviço';
COMMENT ON COLUMN mod_ordem_servico_user_roles.is_technician IS 'Indica se o usuário pode ser atribuído como técnico responsável';
COMMENT ON COLUMN mod_ordem_servico_user_roles.is_attendant IS 'Indica se o usuário pode atender clientes e criar OS';
COMMENT ON COLUMN mod_ordem_servico_user_roles.is_admin IS 'Indica se o usuário tem permissões administrativas no módulo';

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_mod_ordem_servico_user_roles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_mod_ordem_servico_user_roles_updated_at
    BEFORE UPDATE ON mod_ordem_servico_user_roles
    FOR EACH ROW
    EXECUTE FUNCTION update_mod_ordem_servico_user_roles_updated_at();

-- Inserir dados padrão para usuários existentes
-- SUPER_ADMIN e ADMIN são automaticamente administradores do módulo
INSERT INTO mod_ordem_servico_user_roles (tenant_id, user_id, is_technician, is_attendant, is_admin)
SELECT 
    u."tenantId" as tenant_id,
    u.id as user_id,
    false as is_technician,  -- Por padrão, não são técnicos
    true as is_attendant,    -- Por padrão, todos podem atender
    (u.role = 'SUPER_ADMIN' OR u.role = 'ADMIN') as is_admin  -- Admins do sistema são admins do módulo
FROM users u
WHERE u."tenantId" IS NOT NULL 
  AND u."isLocked" = false
  AND NOT EXISTS (
    SELECT 1 FROM mod_ordem_servico_user_roles 
    WHERE tenant_id = u."tenantId" AND user_id = u.id
  );