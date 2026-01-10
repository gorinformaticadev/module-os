-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION CANÔNICA: Schema Consistente do Módulo Ordem de Serviço
-- Versão: 1.0.0
-- Data: 2026-01-10
-- Objetivo: Substituir migrations incrementais por schema limpo e definitivo
-- ═══════════════════════════════════════════════════════════════════════════

-- ==============================================================================
-- FASE 1: LIMPEZA DE TABELAS EXISTENTES (se necessário)
-- ==============================================================================

-- Remover triggers existentes primeiro
DROP TRIGGER IF EXISTS trigger_mod_ordem_servico_clients_updated_at ON mod_ordem_servico_clients;
DROP TRIGGER IF EXISTS trigger_mod_ordem_servico_ordens_updated_at ON mod_ordem_servico_ordens;
DROP TRIGGER IF EXISTS trigger_mod_ordem_servico_user_roles_updated_at ON mod_ordem_servico_user_roles;
DROP TRIGGER IF EXISTS trigger_mod_ordem_servico_products_updated_at ON mod_ordem_servico_products;
DROP TRIGGER IF EXISTS trigger_mod_ordem_servico_tipos_equipamento_updated_at ON mod_ordem_servico_tipos_equipamento;

-- Remover função de trigger existente
DROP FUNCTION IF EXISTS update_mod_ordem_servico_updated_at();

-- ==============================================================================
-- FASE 2: CRIAÇÃO DAS TABELAS CANÔNICAS
-- ==============================================================================

-- Tabela de Clientes
CREATE TABLE IF NOT EXISTS mod_ordem_servico_clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id TEXT NOT NULL,
    name VARCHAR(255) NOT NULL,
    document VARCHAR(20),
    phone_primary VARCHAR(20) NOT NULL,
    phone_secondary VARCHAR(20),
    address TEXT,
    address_number VARCHAR(10),
    address_neighborhood VARCHAR(100),
    address_city VARCHAR(100),
    address_state VARCHAR(2),
    address_zip VARCHAR(9),
    email VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    observations TEXT,
    image_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    
    CONSTRAINT fk_mod_ordem_servico_clients_tenant 
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- Tabela Principal de Ordens de Serviço
CREATE TABLE IF NOT EXISTS mod_ordem_servico_ordens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id TEXT NOT NULL,
    numero TEXT NOT NULL,
    cliente_id UUID NOT NULL,
    usuario_responsavel_id TEXT NOT NULL,
    tecnico_responsavel_id TEXT,
    tipo_servico TEXT NOT NULL,
    descricao TEXT NOT NULL,
    observacoes_internas TEXT,
    laudo_tecnico TEXT,
    valor_servico DECIMAL(10,2) DEFAULT 0.00,
    valor_final DECIMAL(10,2),
    valor_estimado DECIMAL(10,2),
    forma_pagamento TEXT,
    status INTEGER NOT NULL DEFAULT 0 CHECK (status >= 0 AND status <= 7),
    data_abertura TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_previsao TIMESTAMP,
    data_conclusao TIMESTAMP,
    finalizada_em TIMESTAMP,
    origem_solicitacao TEXT NOT NULL CHECK (origem_solicitacao IN ('WHATSAPP', 'PRESENCIAL', 'SISTEMA')),
    orcamento_aprovado BOOLEAN DEFAULT FALSE,
    motivo_cancelamento TEXT,
    equipamento_tipo TEXT,
    equipamento_marca TEXT,
    equipamento_modelo TEXT,
    equipamento_serie TEXT,
    equipamento_estado TEXT,
    equipamento_fotos TEXT,
    formatacao_so TEXT,
    formatacao_backup BOOLEAN DEFAULT FALSE,
    formatacao_backup_descricao TEXT,
    formatacao_senha TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_mod_ordem_servico_ordens_tenant 
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_mod_ordem_servico_ordens_cliente 
        FOREIGN KEY (cliente_id) REFERENCES mod_ordem_servico_clients(id) ON DELETE RESTRICT,
    CONSTRAINT fk_mod_ordem_servico_ordens_usuario_responsavel 
        FOREIGN KEY (usuario_responsavel_id) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT fk_mod_ordem_servico_ordens_tecnico_responsavel 
        FOREIGN KEY (tecnico_responsavel_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT uk_mod_ordem_servico_ordens_numero 
        UNIQUE (tenant_id, numero)
);

-- Tabela de Histórico das Ordens de Serviço
CREATE TABLE IF NOT EXISTS mod_ordem_servico_historico (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id TEXT NOT NULL,
    ordem_servico_id UUID NOT NULL,
    usuario_id TEXT NOT NULL,
    acao TEXT NOT NULL,
    valor_anterior TEXT,
    valor_novo TEXT,
    observacoes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_mod_ordem_servico_historico_tenant 
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_mod_ordem_servico_historico_ordem 
        FOREIGN KEY (ordem_servico_id) REFERENCES mod_ordem_servico_ordens(id) ON DELETE CASCADE,
    CONSTRAINT fk_mod_ordem_servico_historico_usuario 
        FOREIGN KEY (usuario_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Tabela de Papéis dos Usuários (REQUISITO PRINCIPAL)
CREATE TABLE IF NOT EXISTS mod_ordem_servico_user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    is_technician BOOLEAN DEFAULT false,
    is_attendant BOOLEAN DEFAULT true,
    is_admin BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_mod_ordem_servico_user_roles_tenant 
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_mod_ordem_servico_user_roles_user 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT uk_mod_ordem_servico_user_roles_unique 
        UNIQUE (tenant_id, user_id)
);

-- Tabela de Produtos
CREATE TABLE IF NOT EXISTS mod_ordem_servico_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id TEXT NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    cost_price DECIMAL(10,2) DEFAULT 0,
    type VARCHAR(20) DEFAULT 'PRODUCT',
    category VARCHAR(100),
    brand VARCHAR(100),
    stock_quantity INTEGER DEFAULT 0,
    min_stock INTEGER DEFAULT 0,
    barcode VARCHAR(50),
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_mod_ordem_servico_products_tenant 
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- Tabela de Tipos de Equipamento
CREATE TABLE IF NOT EXISTS mod_ordem_servico_tipos_equipamento (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id TEXT NOT NULL,
    nome VARCHAR(100) NOT NULL,
    descricao TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_mod_ordem_servico_tipos_equipamento_tenant 
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT uk_mod_ordem_servico_tipos_equipamento_nome 
        UNIQUE (tenant_id, nome)
);

-- ==============================================================================
-- FASE 3: CRIAÇÃO DOS ÍNDICES PARA PERFORMANCE
-- ==============================================================================

-- Índices para tabela de clientes
CREATE INDEX IF NOT EXISTS idx_mod_ordem_servico_clients_tenant_id 
    ON mod_ordem_servico_clients(tenant_id);
CREATE INDEX IF NOT EXISTS idx_mod_ordem_servico_clients_name 
    ON mod_ordem_servico_clients(name);
CREATE INDEX IF NOT EXISTS idx_mod_ordem_servico_clients_document 
    ON mod_ordem_servico_clients(document);
CREATE INDEX IF NOT EXISTS idx_mod_ordem_servico_clients_state 
    ON mod_ordem_servico_clients(address_state);
CREATE INDEX IF NOT EXISTS idx_mod_ordem_servico_clients_active 
    ON mod_ordem_servico_clients(is_active);
CREATE INDEX IF NOT EXISTS idx_mod_ordem_servico_clients_email 
    ON mod_ordem_servico_clients(email);

-- Índices para tabela de ordens
CREATE INDEX IF NOT EXISTS idx_mod_ordem_servico_ordens_tenant_id 
    ON mod_ordem_servico_ordens(tenant_id);
CREATE INDEX IF NOT EXISTS idx_mod_ordem_servico_ordens_cliente_id 
    ON mod_ordem_servico_ordens(cliente_id);
CREATE INDEX IF NOT EXISTS idx_mod_ordem_servico_ordens_status 
    ON mod_ordem_servico_ordens(status);
CREATE INDEX IF NOT EXISTS idx_mod_ordem_servico_ordens_data_abertura 
    ON mod_ordem_servico_ordens(data_abertura);
CREATE INDEX IF NOT EXISTS idx_mod_ordem_servico_ordens_numero 
    ON mod_ordem_servico_ordens(numero);
CREATE INDEX IF NOT EXISTS idx_mod_ordem_servico_ordens_usuario_responsavel 
    ON mod_ordem_servico_ordens(usuario_responsavel_id);
CREATE INDEX IF NOT EXISTS idx_mod_ordem_servico_ordens_tecnico_responsavel 
    ON mod_ordem_servico_ordens(tecnico_responsavel_id);

-- Índices para tabela de histórico
CREATE INDEX IF NOT EXISTS idx_mod_ordem_servico_historico_tenant_id 
    ON mod_ordem_servico_historico(tenant_id);
CREATE INDEX IF NOT EXISTS idx_mod_ordem_servico_historico_ordem_id 
    ON mod_ordem_servico_historico(ordem_servico_id);
CREATE INDEX IF NOT EXISTS idx_mod_ordem_servico_historico_usuario_id 
    ON mod_ordem_servico_historico(usuario_id);
CREATE INDEX IF NOT EXISTS idx_mod_ordem_servico_historico_created_at 
    ON mod_ordem_servico_historico(created_at);

-- Índices para tabela de papéis de usuário
CREATE INDEX IF NOT EXISTS idx_mod_ordem_servico_user_roles_tenant_id 
    ON mod_ordem_servico_user_roles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_mod_ordem_servico_user_roles_user_id 
    ON mod_ordem_servico_user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_mod_ordem_servico_user_roles_tenant_user 
    ON mod_ordem_servico_user_roles(tenant_id, user_id);
CREATE INDEX IF NOT EXISTS idx_mod_ordem_servico_user_roles_technician 
    ON mod_ordem_servico_user_roles(tenant_id, is_technician) 
    WHERE is_technician = true;

-- Índices para tabela de produtos
CREATE INDEX IF NOT EXISTS idx_mod_ordem_servico_products_tenant_id 
    ON mod_ordem_servico_products(tenant_id);
CREATE INDEX IF NOT EXISTS idx_mod_ordem_servico_products_name 
    ON mod_ordem_servico_products(name);
CREATE INDEX IF NOT EXISTS idx_mod_ordem_servico_products_category 
    ON mod_ordem_servico_products(category);
CREATE INDEX IF NOT EXISTS idx_mod_ordem_servico_products_active 
    ON mod_ordem_servico_products(is_active);

-- Índices para tabela de tipos de equipamento
CREATE INDEX IF NOT EXISTS idx_mod_ordem_servico_tipos_equipamento_tenant_id 
    ON mod_ordem_servico_tipos_equipamento(tenant_id);
CREATE INDEX IF NOT EXISTS idx_mod_ordem_servico_tipos_equipamento_nome 
    ON mod_ordem_servico_tipos_equipamento(nome);

-- ==============================================================================
-- FASE 4: CRIAÇÃO DOS TRIGGERS PARA MANUTENÇÃO AUTOMÁTICA
-- ==============================================================================

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_mod_ordem_servico_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar triggers às tabelas relevantes
CREATE TRIGGER trigger_mod_ordem_servico_clients_updated_at
    BEFORE UPDATE ON mod_ordem_servico_clients
    FOR EACH ROW
    EXECUTE FUNCTION update_mod_ordem_servico_updated_at();

CREATE TRIGGER trigger_mod_ordem_servico_ordens_updated_at
    BEFORE UPDATE ON mod_ordem_servico_ordens
    FOR EACH ROW
    EXECUTE FUNCTION update_mod_ordem_servico_updated_at();

CREATE TRIGGER trigger_mod_ordem_servico_user_roles_updated_at
    BEFORE UPDATE ON mod_ordem_servico_user_roles
    FOR EACH ROW
    EXECUTE FUNCTION update_mod_ordem_servico_updated_at();

CREATE TRIGGER trigger_mod_ordem_servico_products_updated_at
    BEFORE UPDATE ON mod_ordem_servico_products
    FOR EACH ROW
    EXECUTE FUNCTION update_mod_ordem_servico_updated_at();

CREATE TRIGGER trigger_mod_ordem_servico_tipos_equipamento_updated_at
    BEFORE UPDATE ON mod_ordem_servico_tipos_equipamento
    FOR EACH ROW
    EXECUTE FUNCTION update_mod_ordem_servico_updated_at();

-- ==============================================================================
-- FASE 5: SEED INICIAL CANÔNICO
-- ==============================================================================

-- Inserir papéis padrão para usuários existentes
INSERT INTO mod_ordem_servico_user_roles (tenant_id, user_id, is_technician, is_attendant, is_admin)
SELECT 
    u."tenantId" as tenant_id,
    u.id as user_id,
    CASE 
        WHEN u.role = 'ADMIN' THEN true
        ELSE false
    END as is_technician,
    true as is_attendant,
    CASE 
        WHEN u.role = 'ADMIN' THEN true
        ELSE false
    END as is_admin
FROM users u
WHERE u."tenantId" IS NOT NULL 
    AND u."isLocked" = false
    AND NOT EXISTS (
        SELECT 1 FROM mod_ordem_servico_user_roles osr 
        WHERE osr.tenant_id = u."tenantId" AND osr.user_id = u.id
    )
ON CONFLICT (tenant_id, user_id) DO NOTHING;

-- Inserir tipos de equipamento padrão
INSERT INTO mod_ordem_servico_tipos_equipamento (tenant_id, nome, descricao)
SELECT DISTINCT
    t.id as tenant_id,
    tipo.nome,
    tipo.descricao
FROM tenants t
CROSS JOIN (
    VALUES 
        ('Computador', 'Desktop ou tower'),
        ('Notebook', 'Laptop pessoal ou corporativo'),
        ('Servidor', 'Servidor rack ou torre'),
        ('Impressora', 'Jato de tinta, laser ou matricial'),
        ('Scanner', 'Digitalizador de documentos'),
        ('Monitor', 'Display LCD, LED ou CRT'),
        ('Celular', 'Smartphone Android ou iOS'),
        ('Tablet', 'iPad, Android tablet ou similares'),
        ('Roteador', 'Roteador Wi-Fi residencial ou corporativo'),
        ('Switch', 'Switch de rede managed ou unmanaged')
) AS tipo(nome, descricao)
WHERE NOT EXISTS (
    SELECT 1 FROM mod_ordem_servico_tipos_equipamento tet 
    WHERE tet.tenant_id = t.id AND tet.nome = tipo.nome
)
ON CONFLICT (tenant_id, nome) DO NOTHING;

-- ==============================================================================
-- FASE 6: COMENTÁRIOS NAS TABELAS
-- ==============================================================================

COMMENT ON TABLE mod_ordem_servico_ordens IS 'Tabela principal das Ordens de Serviço';
COMMENT ON COLUMN mod_ordem_servico_ordens.status IS 'Status: 0=Orçamento, 1=Aberta, 2=Em Análise, 3=Aguardando Cliente, 4=Aguardando Peças, 5=Em Execução, 6=Finalizada, 7=Cancelada';
COMMENT ON COLUMN mod_ordem_servico_ordens.origem_solicitacao IS 'Origem da solicitação: WHATSAPP, PRESENCIAL, SISTEMA';
COMMENT ON COLUMN mod_ordem_servico_ordens.orcamento_aprovado IS 'Indica se o orçamento foi aprovado pelo cliente';

COMMENT ON TABLE mod_ordem_servico_historico IS 'Histórico de alterações das Ordens de Serviço';
COMMENT ON COLUMN mod_ordem_servico_historico.acao IS 'Tipo de ação: CRIACAO, EDICAO, MUDANCA_STATUS, FINALIZACAO, CANCELAMENTO, APROVACAO_ORCAMENTO';

COMMENT ON TABLE mod_ordem_servico_user_roles IS 'Papéis e permissões dos usuários no módulo de ordem de serviço';

-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION CANÔNICA CONCLUÍDA
-- Esta migration estabelece o schema definitivo para o módulo ordem_servico
-- com todas as constraints, índices e dados iniciais necessários.
-- ═══════════════════════════════════════════════════════════════════════════-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION CANÔNICA: Schema Consistente do Módulo Ordem de Serviço
-- Versão: 1.0.0
-- Data: 2026-01-10
-- Objetivo: Substituir migrations incrementais por schema limpo e definitivo
-- ═══════════════════════════════════════════════════════════════════════════

-- ==============================================================================
-- FASE 1: LIMPEZA DE TABELAS EXISTENTES (se necessário)
-- ==============================================================================

-- Remover triggers existentes primeiro
DROP TRIGGER IF EXISTS trigger_mod_ordem_servico_clients_updated_at ON mod_ordem_servico_clients;
DROP TRIGGER IF EXISTS trigger_mod_ordem_servico_ordens_updated_at ON mod_ordem_servico_ordens;
DROP TRIGGER IF EXISTS trigger_mod_ordem_servico_user_roles_updated_at ON mod_ordem_servico_user_roles;
DROP TRIGGER IF EXISTS trigger_mod_ordem_servico_products_updated_at ON mod_ordem_servico_products;
DROP TRIGGER IF EXISTS trigger_mod_ordem_servico_tipos_equipamento_updated_at ON mod_ordem_servico_tipos_equipamento;

-- Remover função de trigger existente
DROP FUNCTION IF EXISTS update_mod_ordem_servico_updated_at();

-- ==============================================================================
-- FASE 2: CRIAÇÃO DAS TABELAS CANÔNICAS
-- ==============================================================================

-- Tabela de Clientes
CREATE TABLE IF NOT EXISTS mod_ordem_servico_clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id TEXT NOT NULL,
    name VARCHAR(255) NOT NULL,
    document VARCHAR(20),
    phone_primary VARCHAR(20) NOT NULL,
    phone_secondary VARCHAR(20),
    address TEXT,
    address_number VARCHAR(10),
    address_neighborhood VARCHAR(100),
    address_city VARCHAR(100),
    address_state VARCHAR(2),
    address_zip VARCHAR(9),
    email VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    observations TEXT,
    image_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    
    CONSTRAINT fk_mod_ordem_servico_clients_tenant 
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- Tabela Principal de Ordens de Serviço
CREATE TABLE IF NOT EXISTS mod_ordem_servico_ordens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id TEXT NOT NULL,
    numero TEXT NOT NULL,
    cliente_id UUID NOT NULL,
    usuario_responsavel_id TEXT NOT NULL,
    tecnico_responsavel_id TEXT,
    tipo_servico TEXT NOT NULL,
    descricao TEXT NOT NULL,
    observacoes_internas TEXT,
    laudo_tecnico TEXT,
    valor_servico DECIMAL(10,2) DEFAULT 0.00,
    valor_final DECIMAL(10,2),
    valor_estimado DECIMAL(10,2),
    forma_pagamento TEXT,
    status INTEGER NOT NULL DEFAULT 0 CHECK (status >= 0 AND status <= 7),
    data_abertura TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_previsao TIMESTAMP,
    data_conclusao TIMESTAMP,
    finalizada_em TIMESTAMP,
    origem_solicitacao TEXT NOT NULL CHECK (origem_solicitacao IN ('WHATSAPP', 'PRESENCIAL', 'SISTEMA')),
    orcamento_aprovado BOOLEAN DEFAULT FALSE,
    motivo_cancelamento TEXT,
    equipamento_tipo TEXT,
    equipamento_marca TEXT,
    equipamento_modelo TEXT,
    equipamento_serie TEXT,
    equipamento_estado TEXT,
    equipamento_fotos TEXT,
    formatacao_so TEXT,
    formatacao_backup BOOLEAN DEFAULT FALSE,
    formatacao_backup_descricao TEXT,
    formatacao_senha TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_mod_ordem_servico_ordens_tenant 
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_mod_ordem_servico_ordens_cliente 
        FOREIGN KEY (cliente_id) REFERENCES mod_ordem_servico_clients(id) ON DELETE RESTRICT,
    CONSTRAINT fk_mod_ordem_servico_ordens_usuario_responsavel 
        FOREIGN KEY (usuario_responsavel_id) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT fk_mod_ordem_servico_ordens_tecnico_responsavel 
        FOREIGN KEY (tecnico_responsavel_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT uk_mod_ordem_servico_ordens_numero 
        UNIQUE (tenant_id, numero)
);

-- Tabela de Histórico das Ordens de Serviço
CREATE TABLE IF NOT EXISTS mod_ordem_servico_historico (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id TEXT NOT NULL,
    ordem_servico_id UUID NOT NULL,
    usuario_id TEXT NOT NULL,
    acao TEXT NOT NULL,
    valor_anterior TEXT,
    valor_novo TEXT,
    observacoes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_mod_ordem_servico_historico_tenant 
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_mod_ordem_servico_historico_ordem 
        FOREIGN KEY (ordem_servico_id) REFERENCES mod_ordem_servico_ordens(id) ON DELETE CASCADE,
    CONSTRAINT fk_mod_ordem_servico_historico_usuario 
        FOREIGN KEY (usuario_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Tabela de Papéis dos Usuários (REQUISITO PRINCIPAL)
CREATE TABLE IF NOT EXISTS mod_ordem_servico_user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    is_technician BOOLEAN DEFAULT false,
    is_attendant BOOLEAN DEFAULT true,
    is_admin BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_mod_ordem_servico_user_roles_tenant 
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_mod_ordem_servico_user_roles_user 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT uk_mod_ordem_servico_user_roles_unique 
        UNIQUE (tenant_id, user_id)
);

-- Tabela de Produtos
CREATE TABLE IF NOT EXISTS mod_ordem_servico_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id TEXT NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    cost_price DECIMAL(10,2) DEFAULT 0,
    type VARCHAR(20) DEFAULT 'PRODUCT',
    category VARCHAR(100),
    brand VARCHAR(100),
    stock_quantity INTEGER DEFAULT 0,
    min_stock INTEGER DEFAULT 0,
    barcode VARCHAR(50),
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_mod_ordem_servico_products_tenant 
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- Tabela de Tipos de Equipamento
CREATE TABLE IF NOT EXISTS mod_ordem_servico_tipos_equipamento (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id TEXT NOT NULL,
    nome VARCHAR(100) NOT NULL,
    descricao TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_mod_ordem_servico_tipos_equipamento_tenant 
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT uk_mod_ordem_servico_tipos_equipamento_nome 
        UNIQUE (tenant_id, nome)
);

-- ==============================================================================
-- FASE 3: CRIAÇÃO DOS ÍNDICES PARA PERFORMANCE
-- ==============================================================================

-- Índices para tabela de clientes
CREATE INDEX IF NOT EXISTS idx_mod_ordem_servico_clients_tenant_id 
    ON mod_ordem_servico_clients(tenant_id);
CREATE INDEX IF NOT EXISTS idx_mod_ordem_servico_clients_name 
    ON mod_ordem_servico_clients(name);
CREATE INDEX IF NOT EXISTS idx_mod_ordem_servico_clients_document 
    ON mod_ordem_servico_clients(document);
CREATE INDEX IF NOT EXISTS idx_mod_ordem_servico_clients_state 
    ON mod_ordem_servico_clients(address_state);
CREATE INDEX IF NOT EXISTS idx_mod_ordem_servico_clients_active 
    ON mod_ordem_servico_clients(is_active);
CREATE INDEX IF NOT EXISTS idx_mod_ordem_servico_clients_email 
    ON mod_ordem_servico_clients(email);

-- Índices para tabela de ordens
CREATE INDEX IF NOT EXISTS idx_mod_ordem_servico_ordens_tenant_id 
    ON mod_ordem_servico_ordens(tenant_id);
CREATE INDEX IF NOT EXISTS idx_mod_ordem_servico_ordens_cliente_id 
    ON mod_ordem_servico_ordens(cliente_id);
CREATE INDEX IF NOT EXISTS idx_mod_ordem_servico_ordens_status 
    ON mod_ordem_servico_ordens(status);
CREATE INDEX IF NOT EXISTS idx_mod_ordem_servico_ordens_data_abertura 
    ON mod_ordem_servico_ordens(data_abertura);
CREATE INDEX IF NOT EXISTS idx_mod_ordem_servico_ordens_numero 
    ON mod_ordem_servico_ordens(numero);
CREATE INDEX IF NOT EXISTS idx_mod_ordem_servico_ordens_usuario_responsavel 
    ON mod_ordem_servico_ordens(usuario_responsavel_id);
CREATE INDEX IF NOT EXISTS idx_mod_ordem_servico_ordens_tecnico_responsavel 
    ON mod_ordem_servico_ordens(tecnico_responsavel_id);

-- Índices para tabela de histórico
CREATE INDEX IF NOT EXISTS idx_mod_ordem_servico_historico_tenant_id 
    ON mod_ordem_servico_historico(tenant_id);
CREATE INDEX IF NOT EXISTS idx_mod_ordem_servico_historico_ordem_id 
    ON mod_ordem_servico_historico(ordem_servico_id);
CREATE INDEX IF NOT EXISTS idx_mod_ordem_servico_historico_usuario_id 
    ON mod_ordem_servico_historico(usuario_id);
CREATE INDEX IF NOT EXISTS idx_mod_ordem_servico_historico_created_at 
    ON mod_ordem_servico_historico(created_at);

-- Índices para tabela de papéis de usuário
CREATE INDEX IF NOT EXISTS idx_mod_ordem_servico_user_roles_tenant_id 
    ON mod_ordem_servico_user_roles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_mod_ordem_servico_user_roles_user_id 
    ON mod_ordem_servico_user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_mod_ordem_servico_user_roles_tenant_user 
    ON mod_ordem_servico_user_roles(tenant_id, user_id);
CREATE INDEX IF NOT EXISTS idx_mod_ordem_servico_user_roles_technician 
    ON mod_ordem_servico_user_roles(tenant_id, is_technician) 
    WHERE is_technician = true;

-- Índices para tabela de produtos
CREATE INDEX IF NOT EXISTS idx_mod_ordem_servico_products_tenant_id 
    ON mod_ordem_servico_products(tenant_id);
CREATE INDEX IF NOT EXISTS idx_mod_ordem_servico_products_name 
    ON mod_ordem_servico_products(name);
CREATE INDEX IF NOT EXISTS idx_mod_ordem_servico_products_category 
    ON mod_ordem_servico_products(category);
CREATE INDEX IF NOT EXISTS idx_mod_ordem_servico_products_active 
    ON mod_ordem_servico_products(is_active);

-- Índices para tabela de tipos de equipamento
CREATE INDEX IF NOT EXISTS idx_mod_ordem_servico_tipos_equipamento_tenant_id 
    ON mod_ordem_servico_tipos_equipamento(tenant_id);
CREATE INDEX IF NOT EXISTS idx_mod_ordem_servico_tipos_equipamento_nome 
    ON mod_ordem_servico_tipos_equipamento(nome);

-- ==============================================================================
-- FASE 4: CRIAÇÃO DOS TRIGGERS PARA MANUTENÇÃO AUTOMÁTICA
-- ==============================================================================

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_mod_ordem_servico_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar triggers às tabelas relevantes
CREATE TRIGGER trigger_mod_ordem_servico_clients_updated_at
    BEFORE UPDATE ON mod_ordem_servico_clients
    FOR EACH ROW
    EXECUTE FUNCTION update_mod_ordem_servico_updated_at();

CREATE TRIGGER trigger_mod_ordem_servico_ordens_updated_at
    BEFORE UPDATE ON mod_ordem_servico_ordens
    FOR EACH ROW
    EXECUTE FUNCTION update_mod_ordem_servico_updated_at();

CREATE TRIGGER trigger_mod_ordem_servico_user_roles_updated_at
    BEFORE UPDATE ON mod_ordem_servico_user_roles
    FOR EACH ROW
    EXECUTE FUNCTION update_mod_ordem_servico_updated_at();

CREATE TRIGGER trigger_mod_ordem_servico_products_updated_at
    BEFORE UPDATE ON mod_ordem_servico_products
    FOR EACH ROW
    EXECUTE FUNCTION update_mod_ordem_servico_updated_at();

CREATE TRIGGER trigger_mod_ordem_servico_tipos_equipamento_updated_at
    BEFORE UPDATE ON mod_ordem_servico_tipos_equipamento
    FOR EACH ROW
    EXECUTE FUNCTION update_mod_ordem_servico_updated_at();

-- ==============================================================================
-- FASE 5: SEED INICIAL CANÔNICO
-- ==============================================================================

-- Inserir papéis padrão para usuários existentes
INSERT INTO mod_ordem_servico_user_roles (tenant_id, user_id, is_technician, is_attendant, is_admin)
SELECT 
    u."tenantId" as tenant_id,
    u.id as user_id,
    CASE 
        WHEN u.role = 'ADMIN' THEN true
        ELSE false
    END as is_technician,
    true as is_attendant,
    CASE 
        WHEN u.role = 'ADMIN' THEN true
        ELSE false
    END as is_admin
FROM users u
WHERE u."tenantId" IS NOT NULL 
    AND u."isLocked" = false
    AND NOT EXISTS (
        SELECT 1 FROM mod_ordem_servico_user_roles osr 
        WHERE osr.tenant_id = u."tenantId" AND osr.user_id = u.id
    )
ON CONFLICT (tenant_id, user_id) DO NOTHING;

-- Inserir tipos de equipamento padrão
INSERT INTO mod_ordem_servico_tipos_equipamento (tenant_id, nome, descricao)
SELECT DISTINCT
    t.id as tenant_id,
    tipo.nome,
    tipo.descricao
FROM tenants t
CROSS JOIN (
    VALUES 
        ('Computador', 'Desktop ou tower'),
        ('Notebook', 'Laptop pessoal ou corporativo'),
        ('Servidor', 'Servidor rack ou torre'),
        ('Impressora', 'Jato de tinta, laser ou matricial'),
        ('Scanner', 'Digitalizador de documentos'),
        ('Monitor', 'Display LCD, LED ou CRT'),
        ('Celular', 'Smartphone Android ou iOS'),
        ('Tablet', 'iPad, Android tablet ou similares'),
        ('Roteador', 'Roteador Wi-Fi residencial ou corporativo'),
        ('Switch', 'Switch de rede managed ou unmanaged')
) AS tipo(nome, descricao)
WHERE NOT EXISTS (
    SELECT 1 FROM mod_ordem_servico_tipos_equipamento tet 
    WHERE tet.tenant_id = t.id AND tet.nome = tipo.nome
)
ON CONFLICT (tenant_id, nome) DO NOTHING;

-- ==============================================================================
-- FASE 6: COMENTÁRIOS NAS TABELAS
-- ==============================================================================

COMMENT ON TABLE mod_ordem_servico_ordens IS 'Tabela principal das Ordens de Serviço';
COMMENT ON COLUMN mod_ordem_servico_ordens.status IS 'Status: 0=Orçamento, 1=Aberta, 2=Em Análise, 3=Aguardando Cliente, 4=Aguardando Peças, 5=Em Execução, 6=Finalizada, 7=Cancelada';
COMMENT ON COLUMN mod_ordem_servico_ordens.origem_solicitacao IS 'Origem da solicitação: WHATSAPP, PRESENCIAL, SISTEMA';
COMMENT ON COLUMN mod_ordem_servico_ordens.orcamento_aprovado IS 'Indica se o orçamento foi aprovado pelo cliente';

COMMENT ON TABLE mod_ordem_servico_historico IS 'Histórico de alterações das Ordens de Serviço';
COMMENT ON COLUMN mod_ordem_servico_historico.acao IS 'Tipo de ação: CRIACAO, EDICAO, MUDANCA_STATUS, FINALIZACAO, CANCELAMENTO, APROVACAO_ORCAMENTO';

COMMENT ON TABLE mod_ordem_servico_user_roles IS 'Papéis e permissões dos usuários no módulo de ordem de serviço';

-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION CANÔNICA CONCLUÍDA
-- Esta migration estabelece o schema definitivo para o módulo ordem_servico
-- com todas as constraints, índices e dados iniciais necessários.
-- ═══════════════════════════════════════════════════════════════════════════