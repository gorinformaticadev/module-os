-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION: Adiciona tenant_id à tabela de notificações
-- Versão: 1.0.1
-- Data: 2026-01-06
-- ═══════════════════════════════════════════════════════════════════════════

-- Limpar dados existentes para permitir NOT NULL (Assumindo que dados sem tenant são inválidos e o sistema deve ser limpo)
TRUNCATE TABLE mod_ordem_servico_notification_schedules;

-- Adicionar coluna tenant_id
ALTER TABLE mod_ordem_servico_notification_schedules
ADD COLUMN IF NOT EXISTS tenant_id TEXT NOT NULL;

-- Adicionar FK
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_mod_ordem_servico_notifications_tenant') THEN
        ALTER TABLE mod_ordem_servico_notification_schedules
        ADD CONSTRAINT fk_mod_ordem_servico_notifications_tenant FOREIGN KEY (tenant_id)
        REFERENCES tenants(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Adicionar Index
CREATE INDEX IF NOT EXISTS idx_mod_ordem_servico_notif_tenant ON mod_ordem_servico_notification_schedules(tenant_id);
