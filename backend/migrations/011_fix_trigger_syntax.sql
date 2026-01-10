-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION: Fix Trigger Syntax (Correção da migrate 009)
-- Versão: 1.0.4 - Single Quotes
-- ═══════════════════════════════════════════════════════════════════════════

-- Remover trigger antigo se existir
DROP TRIGGER IF EXISTS update_mod_ordem_servico_ordens_updated_at ON mod_ordem_servico_ordens;
DROP TRIGGER IF EXISTS trigger_mod_ordem_servico_ordens_updated_at ON mod_ordem_servico_ordens;

-- Remover função antiga se existir
DROP FUNCTION IF EXISTS update_mod_ordem_servico_ordens_updated_at() CASCADE;

-- Recriar Function usando aspas simples para facilitar parsing do script customizado
CREATE OR REPLACE FUNCTION update_mod_ordem_servico_ordens_updated_at()
RETURNS TRIGGER AS '
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
' language 'plpgsql';

-- Recriar Trigger
CREATE TRIGGER update_mod_ordem_servico_ordens_updated_at
    BEFORE UPDATE ON mod_ordem_servico_ordens
    FOR EACH ROW
    EXECUTE FUNCTION update_mod_ordem_servico_ordens_updated_at();
