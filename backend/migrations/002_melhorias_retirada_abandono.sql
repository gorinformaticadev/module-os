-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION 002: Melhorias de Retirada e Abandono
-- Versao: 1.0.0
-- Data: 2026-01-26
-- Descricao: Novos status (RETIRADO, ABANDONADO), historico de status,
--            sistema de pagamentos, taxa de conservacao e alertas de abandono
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. ALTERAR CONSTRAINT DE STATUS NA TABELA PRINCIPAL
-- ═══════════════════════════════════════════════════════════════════════════
-- Status existentes: 0-7 (ORCAMENTO, ABERTA, EM_ANALISE, AGUARDANDO_CLIENTE,
--                        AGUARDANDO_PECAS, EM_EXECUCAO, FINALIZADA, CANCELADA)
-- Novos status: 8 (RETIRADO), 9 (ABANDONADO)

ALTER TABLE mod_ordem_servico_ordens 
DROP CONSTRAINT IF EXISTS mod_ordem_servico_ordens_status_check;

ALTER TABLE mod_ordem_servico_ordens 
ADD CONSTRAINT mod_ordem_servico_ordens_status_check 
CHECK (status >= 0 AND status <= 9);

-- 2. ADICIONAR NOVOS CAMPOS NA TABELA PRINCIPAL
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE mod_ordem_servico_ordens 
ADD COLUMN IF NOT EXISTS valor_conservacao DECIMAL(10,2) DEFAULT 0;

ALTER TABLE mod_ordem_servico_ordens 
ADD COLUMN IF NOT EXISTS dias_atraso INTEGER DEFAULT 0;

ALTER TABLE mod_ordem_servico_ordens 
ADD COLUMN IF NOT EXISTS justificativa_conservacao TEXT;

ALTER TABLE mod_ordem_servico_ordens 
ADD COLUMN IF NOT EXISTS data_limite_retirada TIMESTAMP;

ALTER TABLE mod_ordem_servico_ordens 
ADD COLUMN IF NOT EXISTS data_retirada TIMESTAMP;

-- Indice para consultas de OS aguardando retirada
CREATE INDEX IF NOT EXISTS idx_mod_os_ordens_data_conclusao 
ON mod_ordem_servico_ordens(data_conclusao) 
WHERE status = 6;

-- 3. TABELA DE HISTORICO ESPECIFICO DE STATUS
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS mod_ordem_servico_status_historico (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id TEXT NOT NULL,
    ordem_servico_id UUID NOT NULL,
    
    -- Dados da mudanca de status
    status_anterior INTEGER NOT NULL,
    status_novo INTEGER NOT NULL,
    
    -- Metadados
    usuario_id TEXT NOT NULL,
    data_alteracao TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    observacoes TEXT,
    
    -- Auditoria (imutavel - apenas created_at, sem updated_at)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT fk_status_hist_tenant FOREIGN KEY (tenant_id)
        REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_status_hist_ordem FOREIGN KEY (ordem_servico_id)
        REFERENCES mod_ordem_servico_ordens(id) ON DELETE CASCADE,
    CONSTRAINT chk_status_hist_anterior CHECK (status_anterior >= 0 AND status_anterior <= 9),
    CONSTRAINT chk_status_hist_novo CHECK (status_novo >= 0 AND status_novo <= 9)
);

-- Indices para consulta rapida
CREATE INDEX IF NOT EXISTS idx_status_hist_ordem 
ON mod_ordem_servico_status_historico(ordem_servico_id);

CREATE INDEX IF NOT EXISTS idx_status_hist_data 
ON mod_ordem_servico_status_historico(data_alteracao DESC);

CREATE INDEX IF NOT EXISTS idx_status_hist_tenant 
ON mod_ordem_servico_status_historico(tenant_id);

-- 4. TABELA DE PAGAMENTOS (RETIRADA)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS mod_ordem_servico_pagamentos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id TEXT NOT NULL,
    ordem_servico_id UUID NOT NULL,
    
    -- Dados do pagamento
    forma_pagamento VARCHAR(50) NOT NULL,
    valor DECIMAL(10,2) NOT NULL,
    parcelas INTEGER DEFAULT 1,
    
    -- Metadados
    observacoes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by TEXT NOT NULL,
    
    -- Constraints
    CONSTRAINT fk_pagamento_tenant FOREIGN KEY (tenant_id)
        REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_pagamento_ordem FOREIGN KEY (ordem_servico_id)
        REFERENCES mod_ordem_servico_ordens(id) ON DELETE CASCADE,
    CONSTRAINT chk_pagamento_valor CHECK (valor > 0),
    CONSTRAINT chk_pagamento_parcelas CHECK (parcelas >= 1 AND parcelas <= 12)
);

CREATE INDEX IF NOT EXISTS idx_pagamentos_ordem 
ON mod_ordem_servico_pagamentos(ordem_servico_id);

CREATE INDEX IF NOT EXISTS idx_pagamentos_tenant 
ON mod_ordem_servico_pagamentos(tenant_id);

-- 5. TABELA DE ALERTAS DE ABANDONO
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS mod_ordem_servico_alertas_abandono (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id TEXT NOT NULL,
    ordem_servico_id UUID NOT NULL,
    
    -- Sequencia do alerta (1, 2 ou 3)
    numero_alerta INTEGER NOT NULL,
    
    -- Dados do envio
    data_envio TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    meio_comunicacao VARCHAR(50) NOT NULL,
    enviado_por TEXT NOT NULL,
    
    -- Conteudo
    mensagem TEXT,
    observacoes TEXT,
    
    -- Metadados
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT fk_alerta_tenant FOREIGN KEY (tenant_id)
        REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_alerta_ordem FOREIGN KEY (ordem_servico_id)
        REFERENCES mod_ordem_servico_ordens(id) ON DELETE CASCADE,
    CONSTRAINT chk_alerta_numero CHECK (numero_alerta BETWEEN 1 AND 3),
    CONSTRAINT chk_alerta_meio CHECK (meio_comunicacao IN ('WHATSAPP', 'EMAIL', 'SMS', 'CARTA', 'TELEFONE')),
    CONSTRAINT uk_alerta_ordem_numero UNIQUE (ordem_servico_id, numero_alerta)
);

CREATE INDEX IF NOT EXISTS idx_alertas_abandono_ordem 
ON mod_ordem_servico_alertas_abandono(ordem_servico_id);

CREATE INDEX IF NOT EXISTS idx_alertas_abandono_tenant 
ON mod_ordem_servico_alertas_abandono(tenant_id);

-- 6. TABELA DE ANEXOS DOS ALERTAS
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS mod_ordem_servico_anexos_abandono (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id TEXT NOT NULL,
    alerta_id UUID NOT NULL,
    
    -- Dados do arquivo
    nome_arquivo VARCHAR(255) NOT NULL,
    tipo_arquivo VARCHAR(100) NOT NULL,
    tamanho_bytes INTEGER,
    url_arquivo TEXT NOT NULL,
    
    -- Descricao
    descricao TEXT,
    
    -- Metadados
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    uploaded_by TEXT NOT NULL,
    
    -- Constraints
    CONSTRAINT fk_anexo_tenant FOREIGN KEY (tenant_id)
        REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_anexo_alerta FOREIGN KEY (alerta_id)
        REFERENCES mod_ordem_servico_alertas_abandono(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_anexos_abandono_alerta 
ON mod_ordem_servico_anexos_abandono(alerta_id);

CREATE INDEX IF NOT EXISTS idx_anexos_abandono_tenant 
ON mod_ordem_servico_anexos_abandono(tenant_id);

-- 7. CONFIGURACOES DE CONSERVACAO
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO mod_ordem_servico_configs (tenant_id, key, value)
SELECT t.id, 'prazo_retirada_dias', '30'
FROM tenants t 
WHERE NOT EXISTS (
    SELECT 1 FROM mod_ordem_servico_configs 
    WHERE tenant_id = t.id AND key = 'prazo_retirada_dias'
);

INSERT INTO mod_ordem_servico_configs (tenant_id, key, value)
SELECT t.id, 'valor_conservacao_diario', '5.00'
FROM tenants t 
WHERE NOT EXISTS (
    SELECT 1 FROM mod_ordem_servico_configs 
    WHERE tenant_id = t.id AND key = 'valor_conservacao_diario'
);

INSERT INTO mod_ordem_servico_configs (tenant_id, key, value)
SELECT t.id, 'conservacao_habilitada', 'true'
FROM tenants t 
WHERE NOT EXISTS (
    SELECT 1 FROM mod_ordem_servico_configs 
    WHERE tenant_id = t.id AND key = 'conservacao_habilitada'
);

INSERT INTO mod_ordem_servico_configs (tenant_id, key, value)
SELECT t.id, 'intervalo_alertas_dias', '7'
FROM tenants t 
WHERE NOT EXISTS (
    SELECT 1 FROM mod_ordem_servico_configs 
    WHERE tenant_id = t.id AND key = 'intervalo_alertas_dias'
);

-- 8. VIEW PARA ALERTAS DE RETIRADA (BADGES)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE VIEW vw_mod_os_alertas_retirada AS
SELECT 
    tenant_id,
    COUNT(*) as total_pendentes,
    COUNT(*) FILTER (WHERE dias_desde_finalizacao > 30) as urgentes,
    COUNT(*) FILTER (WHERE dias_desde_finalizacao BETWEEN 15 AND 30) as atencao,
    COUNT(*) FILTER (WHERE dias_desde_finalizacao < 15) as normal,
    COUNT(*) FILTER (WHERE dias_desde_finalizacao > prazo_config) as cobranca_ativa
FROM (
    SELECT 
        o.tenant_id,
        o.id,
        EXTRACT(DAY FROM (NOW() - o.data_conclusao))::int as dias_desde_finalizacao,
        COALESCE((
            SELECT c.value::int 
            FROM mod_ordem_servico_configs c 
            WHERE c.tenant_id = o.tenant_id AND c.key = 'prazo_retirada_dias'
        ), 30) as prazo_config
    FROM mod_ordem_servico_ordens o
    WHERE o.status = 6 -- FINALIZADA (aguardando retirada)
    AND o.data_conclusao IS NOT NULL
) sub
GROUP BY tenant_id;

-- 9. PERMISSOES PARA NOVAS FUNCIONALIDADES
-- ═══════════════════════════════════════════════════════════════════════════

-- Permissoes para Admin
INSERT INTO mod_ordem_servico_profile_permissions (tenant_id, permission_id, profile, allowed)
SELECT t.id, unnest(ARRAY[
    'orders_mark_retirado',
    'orders_mark_abandonado',
    'orders_register_payment',
    'orders_apply_conservation',
    'orders_send_alerts',
    'orders_view_alerts',
    'config_conservation'
]), 'admin', true
FROM tenants t 
ON CONFLICT (tenant_id, permission_id, profile) DO NOTHING;

-- Permissoes para Technician (apenas visualizar alertas)
INSERT INTO mod_ordem_servico_profile_permissions (tenant_id, permission_id, profile, allowed)
SELECT t.id, 'orders_view_alerts', 'technician', true
FROM tenants t 
ON CONFLICT (tenant_id, permission_id, profile) DO NOTHING;

-- Permissoes para Attendant (registrar pagamento e enviar alertas)
INSERT INTO mod_ordem_servico_profile_permissions (tenant_id, permission_id, profile, allowed)
SELECT t.id, unnest(ARRAY[
    'orders_register_payment',
    'orders_send_alerts',
    'orders_view_alerts'
]), 'attendant', true
FROM tenants t 
ON CONFLICT (tenant_id, permission_id, profile) DO NOTHING;

-- 10. COMENTARIOS DE DOCUMENTACAO
-- ═══════════════════════════════════════════════════════════════════════════

COMMENT ON COLUMN mod_ordem_servico_ordens.valor_conservacao IS 'Valor da taxa de conservacao por atraso na retirada';
COMMENT ON COLUMN mod_ordem_servico_ordens.dias_atraso IS 'Quantidade de dias de atraso na retirada';
COMMENT ON COLUMN mod_ordem_servico_ordens.justificativa_conservacao IS 'Justificativa para isencao ou alteracao da taxa de conservacao';
COMMENT ON COLUMN mod_ordem_servico_ordens.data_limite_retirada IS 'Data limite para retirada sem cobranca de conservacao';
COMMENT ON COLUMN mod_ordem_servico_ordens.data_retirada IS 'Data efetiva da retirada do equipamento';

COMMENT ON TABLE mod_ordem_servico_status_historico IS 'Historico imutavel de mudancas de status das ordens de servico';
COMMENT ON TABLE mod_ordem_servico_pagamentos IS 'Formas de pagamento utilizadas na retirada da ordem de servico';
COMMENT ON TABLE mod_ordem_servico_alertas_abandono IS 'Alertas enviados ao cliente antes de marcar como abandonado (maximo 3)';
COMMENT ON TABLE mod_ordem_servico_anexos_abandono IS 'Comprovantes anexados aos alertas de abandono';

COMMENT ON VIEW vw_mod_os_alertas_retirada IS 'View agregada para exibicao de badges de alertas de retirada por tenant';
