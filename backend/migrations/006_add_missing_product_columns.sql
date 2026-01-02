-- Migração para adicionar colunas faltantes na tabela de produtos
-- Data: 2026-01-02
-- Descrição: Adiciona colunas type, image_url e cost_price

-- Verificar se as colunas já existem antes de adicionar
DO $$ 
BEGIN
    -- Adicionar coluna type se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'mod_ordem_servico_products' 
                   AND column_name = 'type') THEN
        ALTER TABLE mod_ordem_servico_products 
        ADD COLUMN type VARCHAR(20) DEFAULT 'PRODUCT' NOT NULL;
        
        -- Atualizar registros existentes
        UPDATE mod_ordem_servico_products 
        SET type = 'PRODUCT' 
        WHERE type IS NULL;
    END IF;

    -- Adicionar coluna image_url se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'mod_ordem_servico_products' 
                   AND column_name = 'image_url') THEN
        ALTER TABLE mod_ordem_servico_products 
        ADD COLUMN image_url TEXT NULL;
    END IF;

    -- Adicionar coluna cost_price se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'mod_ordem_servico_products' 
                   AND column_name = 'cost_price') THEN
        ALTER TABLE mod_ordem_servico_products 
        ADD COLUMN cost_price DECIMAL(10,2) DEFAULT 0.00;
    END IF;
END $$;

-- Verificar estrutura final da tabela
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'mod_ordem_servico_products'
ORDER BY ordinal_position;