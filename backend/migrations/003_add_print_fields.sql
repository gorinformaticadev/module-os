-- ═══════════════════════════════════════════════════════════════════════════
-- Migration 003: Adicionar Campos para Impressão
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Adicionar campo de garantia (em dias) à tabela de ordens
ALTER TABLE mod_ordem_servico_ordens 
ADD COLUMN IF NOT EXISTS garantia_dias INTEGER DEFAULT 0;

COMMENT ON COLUMN mod_ordem_servico_ordens.garantia_dias IS 'Período de garantia em dias para o serviço realizado';

-- 2. Adicionar configuração padrão de condições de execução para todos os tenants
INSERT INTO mod_ordem_servico_configs (tenant_id, key, value)
SELECT 
    t.id as tenant_id,
    'condicoes_execucao' as key,
    'O serviço será executado conforme descrito acima. Eventuais alterações serão comunicadas ao cliente. A garantia cobre apenas defeitos relacionados ao serviço executado.' as value
FROM tenants t
WHERE NOT EXISTS (
    SELECT 1 FROM mod_ordem_servico_configs 
    WHERE tenant_id = t.id AND key = 'condicoes_execucao'
);

COMMENT ON TABLE mod_ordem_servico_configs IS 'Configurações do módulo de ordem de serviço, incluindo condições de execução para impressão';
