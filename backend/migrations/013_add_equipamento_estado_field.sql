-- Adição do campo equipamento_estado para Ordem de Serviço
-- Refinamento da seção de Equipamentos

ALTER TABLE mod_ordem_servico_ordens 
ADD COLUMN IF NOT EXISTS equipamento_estado TEXT;

-- Comentários
COMMENT ON COLUMN mod_ordem_servico_ordens.equipamento_estado IS 'Estado de entrega / observações do equipamento no recebimento';
