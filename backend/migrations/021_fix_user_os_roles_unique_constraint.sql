-- 
-- MIGRATION: Fix Unique Constraint for User OS Roles
-- Objetivo: Remover duplicados e garantir constraint UNIQUE para ON CONFLICT
-- Data: 2026-01-09
-- 

-- 1. Clean duplicates
WITH duplicates AS (
    SELECT 
        id,
        ROW_NUMBER() OVER (
            PARTITION BY tenant_id, user_id 
            ORDER BY created_at DESC, id DESC
        ) as rn
    FROM mod_ordem_servico_user_roles
)
DELETE FROM mod_ordem_servico_user_roles
WHERE id IN (
    SELECT id FROM duplicates WHERE rn > 1
);

-- 2. Add Constraint
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_constraint 
        WHERE conname = 'uk_mod_ordem_servico_user_roles_user_tenant'
    ) THEN
        ALTER TABLE mod_ordem_servico_user_roles
        ADD CONSTRAINT uk_mod_ordem_servico_user_roles_user_tenant 
        UNIQUE (tenant_id, user_id);
    END IF;
END $$;
