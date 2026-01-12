-- Adiciona coluna itens para armazenar JSON dos produtos/serviços da ordem
ALTER TABLE mod_ordem_servico_ordens ADD COLUMN IF NOT EXISTS itens TEXT;
