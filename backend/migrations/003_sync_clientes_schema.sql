-- ============================================================================
-- MIGRATION 003: Sincronização completa do schema de clientes
-- Módulo: ordem_servico
-- Data: 2026-04-27
--
-- Objetivo: garantir que a tabela mod_clientes_clients tenha todas as colunas
-- necessárias, independente de o módulo "clientes" estar instalado ou não.
--
-- Comportamento:
--   - Se apenas o módulo OS estiver instalado: cria/completa a tabela
--   - Se o módulo clientes já estiver instalado: apenas adiciona colunas
--     que ainda faltarem (ADD COLUMN IF NOT EXISTS é idempotente)
-- ============================================================================

-- 1. Campos de perfil ampliado (equivalente à migration 002 do módulo clientes)
-- ----------------------------------------------------------------------------
ALTER TABLE mod_clientes_clients
    ADD COLUMN IF NOT EXISTS person_type VARCHAR(20),
    ADD COLUMN IF NOT EXISTS trade_name VARCHAR(255),
    ADD COLUMN IF NOT EXISTS rg VARCHAR(20),
    ADD COLUMN IF NOT EXISTS state_registration VARCHAR(30),
    ADD COLUMN IF NOT EXISTS gender VARCHAR(20),
    ADD COLUMN IF NOT EXISTS credit_limit NUMERIC(12,2),
    ADD COLUMN IF NOT EXISTS settlement_day INTEGER,
    ADD COLUMN IF NOT EXISTS customer_group VARCHAR(100),
    ADD COLUMN IF NOT EXISTS birth_date DATE,
    ADD COLUMN IF NOT EXISTS registration_status VARCHAR(20) DEFAULT 'ACTIVE';

-- Preencher registration_status nos registros existentes
UPDATE mod_clientes_clients
SET registration_status = CASE
    WHEN COALESCE(is_active, true) = true THEN 'ACTIVE'
    ELSE 'INACTIVE'
END
WHERE registration_status IS NULL;

-- Recriar constraint de status (idempotente via DROP + ADD)
ALTER TABLE mod_clientes_clients
    DROP CONSTRAINT IF EXISTS chk_mod_clientes_clients_registration_status;

ALTER TABLE mod_clientes_clients
    ADD CONSTRAINT chk_mod_clientes_clients_registration_status
    CHECK (registration_status IN ('ACTIVE', 'INACTIVE', 'BLOCKED'));

-- Recriar constraint de person_type (idempotente via DROP + ADD)
ALTER TABLE mod_clientes_clients
    DROP CONSTRAINT IF EXISTS chk_mod_clientes_clients_person_type;

ALTER TABLE mod_clientes_clients
    ADD CONSTRAINT chk_mod_clientes_clients_person_type
    CHECK (person_type IS NULL OR person_type IN ('PERSON', 'COMPANY'));

-- Recriar constraint de settlement_day (idempotente via DROP + ADD)
ALTER TABLE mod_clientes_clients
    DROP CONSTRAINT IF EXISTS chk_mod_clientes_clients_settlement_day;

ALTER TABLE mod_clientes_clients
    ADD CONSTRAINT chk_mod_clientes_clients_settlement_day
    CHECK (settlement_day IS NULL OR settlement_day BETWEEN 1 AND 31);

CREATE INDEX IF NOT EXISTS idx_mod_clientes_clients_registration_status
    ON mod_clientes_clients(registration_status);

CREATE INDEX IF NOT EXISTS idx_mod_clientes_clients_person_type
    ON mod_clientes_clients(person_type);

-- 2. Grupos de clientes (equivalente às migrations 003 e 004 do módulo clientes)
-- ----------------------------------------------------------------------------

-- Tabela de grupos
CREATE TABLE IF NOT EXISTS mod_clientes_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id TEXT NOT NULL,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    CONSTRAINT fk_mod_clientes_groups_tenant
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_mod_clientes_groups_tenant
    ON mod_clientes_groups(tenant_id);

CREATE INDEX IF NOT EXISTS idx_mod_clientes_groups_deleted
    ON mod_clientes_groups(deleted_at) WHERE deleted_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uk_mod_clientes_groups_tenant_name
    ON mod_clientes_groups(tenant_id, LOWER(name)) WHERE deleted_at IS NULL;

-- Trigger de atualização automática para grupos
CREATE OR REPLACE FUNCTION update_mod_clientes_groups_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS trg_mod_clientes_groups_updated_at ON mod_clientes_groups;
CREATE TRIGGER trg_mod_clientes_groups_updated_at
    BEFORE UPDATE ON mod_clientes_groups
    FOR EACH ROW
    EXECUTE FUNCTION update_mod_clientes_groups_timestamp();

-- Coluna de grupo no cliente
ALTER TABLE mod_clientes_clients
    ADD COLUMN IF NOT EXISTS customer_group_id UUID;

-- FK do grupo (idempotente via bloco DO)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'fk_mod_clientes_clients_customer_group'
          AND conrelid = 'mod_clientes_clients'::regclass
    ) THEN
        ALTER TABLE mod_clientes_clients
            ADD CONSTRAINT fk_mod_clientes_clients_customer_group
            FOREIGN KEY (customer_group_id) REFERENCES mod_clientes_groups(id) ON DELETE SET NULL;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_mod_clientes_clients_customer_group_id
    ON mod_clientes_clients(customer_group_id) WHERE deleted_at IS NULL;

-- Tabela de relacionamento N:N clientes <-> grupos
CREATE TABLE IF NOT EXISTS mod_clientes_client_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id TEXT NOT NULL,
    client_id UUID NOT NULL,
    group_id UUID NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_mod_clientes_client_groups_tenant
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_mod_clientes_client_groups_client
        FOREIGN KEY (client_id) REFERENCES mod_clientes_clients(id) ON DELETE CASCADE,
    CONSTRAINT fk_mod_clientes_client_groups_group
        FOREIGN KEY (group_id) REFERENCES mod_clientes_groups(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS uk_mod_clientes_client_groups_tenant_client_group
    ON mod_clientes_client_groups(tenant_id, client_id, group_id);

CREATE INDEX IF NOT EXISTS idx_mod_clientes_client_groups_client
    ON mod_clientes_client_groups(client_id);

CREATE INDEX IF NOT EXISTS idx_mod_clientes_client_groups_group
    ON mod_clientes_client_groups(group_id);

-- 3. Campos de auditoria (equivalente à migration 006 do módulo clientes)
-- ----------------------------------------------------------------------------
ALTER TABLE mod_clientes_clients
    ADD COLUMN IF NOT EXISTS created_by TEXT,
    ADD COLUMN IF NOT EXISTS updated_by TEXT;

CREATE INDEX IF NOT EXISTS idx_mod_clientes_clients_tenant_created_by
    ON mod_clientes_clients(tenant_id, created_by) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_mod_clientes_clients_tenant_updated_by
    ON mod_clientes_clients(tenant_id, updated_by) WHERE deleted_at IS NULL;
