-- Adição de campos refinados para Ordem de Serviço
-- Equipamento, Prioridade e Observações do Cliente

ALTER TABLE mod_ordem_servico_ordens 
ADD COLUMN IF NOT EXISTS prioridade TEXT DEFAULT 'MEDIA',
ADD COLUMN IF NOT EXISTS observacoes_cliente TEXT,
ADD COLUMN IF NOT EXISTS equipamento_tipo TEXT,
ADD COLUMN IF NOT EXISTS equipamento_marca TEXT,
ADD COLUMN IF NOT EXISTS equipamento_modelo TEXT,
ADD COLUMN IF NOT EXISTS equipamento_serie TEXT,
ADD COLUMN IF NOT EXISTS equipamento_acessorios TEXT;

-- Comentários
COMMENT ON COLUMN mod_ordem_servico_ordens.prioridade IS 'Prioridade da OS: BAIXA, MEDIA, ALTA';
COMMENT ON COLUMN mod_ordem_servico_ordens.observacoes_cliente IS 'Observações visíveis ao cliente';
COMMENT ON COLUMN mod_ordem_servico_ordens.equipamento_tipo IS 'Tipo do equipamento (ex: Notebook, Celular)';
