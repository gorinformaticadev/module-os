# Banco de Dados e Migrações

<cite>
**Arquivos Referenciados Neste Documento**
- [001_master.sql](file://backend/migrations/001_master.sql)
- [003_add_print_fields.sql](file://backend/migrations/003_add_print_fields.sql)
- [004_add_tables_os.sql](file://backend/migrations/004_add_tables_os.sql)
- [seed.sql](file://backend/seeds/seed.sql)
- [seeds_os.sql](file://backend/seeds/seeds_os.sql)
- [permissions_seed.sql](file://backend/seeds/permissions_seed.sql)
- [ordem_servico.module.ts](file://backend/ordem_servico.module.ts)
- [module.config.json](file://backend/module.config.json)
- [module.json](file://backend/module.json)
- [ordens.service.ts](file://backend/ordens/ordens.service.ts)
- [clientes.service.ts](file://backend/clientes/clientes.service.ts)
- [produtos.service.ts](file://backend/produtos/produtos.service.ts)
- [configuracoes.service.ts](file://backend/configuracoes/configuracoes.service.ts)
- [permission.service.ts](file://backend/shared/services/permission.service.ts)
- [permission.guard.ts](file://backend/shared/guards/permission.guard.ts)
- [available-permissions.ts](file://backend/shared/constants/available-permissions.ts)
</cite>

## Sumário
- Introdução
- Estrutura do Projeto
- Componentes Principais
- Visão Geral da Arquitetura
- Análise Detalhada de Componentes
- Análise de Dependências
- Considerações de Desempenho
- Guia de Solução de Problemas
- Conclusão
- Apêndices

## Introdução
Este documento apresenta o modelo de dados e o sistema de migrações do módulo de Ordens de Serviço. Ele descreve entidades, relacionamentos, tipos de dados, chaves primárias/estrangeiras, índices, restrições, regras de validação e regras de negócio. Também inclui padrões de acesso a dados, estratégias de cache, considerações de desempenho, ciclo de vida dos dados, políticas de retenção, regras de arquivamento, caminhos de migração e gerenciamento de versões, além de segurança de dados, requisitos de privacidade e controle de acesso.

## Estrutura do Projeto
O módulo é composto por:
- Migrações SQL que criam e atualizam o esquema do banco de dados
- Seeds iniciais que populam dados essenciais
- Serviços NestJS que encapsulam acesso a dados e regras de negócio
- Guardas e serviços de permissão para controle de acesso
- Módulos que agrupam funcionalidades

```mermaid
graph TB
subgraph "Migrações"
M1["001_master.sql"]
M3["003_add_print_fields.sql"]
M4["004_add_tables_os.sql"]
end
subgraph "Seeds"
S1["seed.sql"]
S2["seeds_os.sql"]
S3["permissions_seed.sql"]
end
subgraph "Backend"
MOD["ordem_servico.module.ts"]
CFG["module.config.json"]
MJ["module.json"]
subgraph "Serviços"
OS["ordens.service.ts"]
CL["clientes.service.ts"]
PR["produtos.service.ts"]
CO["configuracoes.service.ts"]
PS["permission.service.ts"]
end
subgraph "Segurança"
PG["permission.guard.ts"]
AP["available-permissions.ts"]
end
end
M1 --> MOD
M3 --> MOD
M4 --> MOD
S1 --> MOD
S2 --> MOD
S3 --> MOD
MOD --> OS
MOD --> CL
MOD --> PR
MOD --> CO
MOD --> PS
PS --> PG
AP --> PG
```

**Diagrama Fonte**
- [001_master.sql](file://backend/migrations/001_master.sql#L1-L622)
- [003_add_print_fields.sql](file://backend/migrations/003_add_print_fields.sql#L1-L24)
- [004_add_tables_os.sql](file://backend/migrations/004_add_tables_os.sql#L1-L80)
- [seed.sql](file://backend/seeds/seed.sql#L1-L18)
- [seeds_os.sql](file://backend/seeds/seeds_os.sql#L1-L69)
- [permissions_seed.sql](file://backend/seeds/permissions_seed.sql#L1-L329)
- [ordem_servico.module.ts](file://backend/ordem_servico.module.ts#L1-L35)
- [module.config.json](file://backend/module.config.json#L1-L79)
- [module.json](file://backend/module.json#L1-L48)
- [ordens.service.ts](file://backend/ordens/ordens.service.ts#L1-L1148)
- [clientes.service.ts](file://backend/clientes/clientes.service.ts#L1-L253)
- [produtos.service.ts](file://backend/produtos/produtos.service.ts#L1-L169)
- [configuracoes.service.ts](file://backend/configuracoes/configuracoes.service.ts#L1-L331)
- [permission.service.ts](file://backend/shared/services/permission.service.ts#L1-L313)
- [permission.guard.ts](file://backend/shared/guards/permission.guard.ts#L1-L58)
- [available-permissions.ts](file://backend/shared/constants/available-permissions.ts#L1-L164)

**Seção Fonte**
- [ordem_servico.module.ts](file://backend/ordem_servico.module.ts#L1-L35)
- [module.config.json](file://backend/module.config.json#L1-L79)
- [module.json](file://backend/module.json#L1-L48)

## Componentes Principais
- Migrações: scripts SQL que criam tabelas, índices, triggers e dados iniciais
- Seeds: dados iniciais para configurações, permissões e dados de exemplo
- Serviços: acesso a dados e regras de negócio implementadas com Prisma
- Segurança: permissões granulares, auditoria e guardas de rota

**Seção Fonte**
- [001_master.sql](file://backend/migrations/001_master.sql#L1-L622)
- [003_add_print_fields.sql](file://backend/migrations/003_add_print_fields.sql#L1-L24)
- [004_add_tables_os.sql](file://backend/migrations/004_add_tables_os.sql#L1-L80)
- [seed.sql](file://backend/seeds/seed.sql#L1-L18)
- [seeds_os.sql](file://backend/seeds/seeds_os.sql#L1-L69)
- [permissions_seed.sql](file://backend/seeds/permissions_seed.sql#L1-L329)
- [ordens.service.ts](file://backend/ordens/ordens.service.ts#L1-L1148)
- [clientes.service.ts](file://backend/clientes/clientes.service.ts#L1-L253)
- [produtos.service.ts](file://backend/produtos/produtos.service.ts#L1-L169)
- [configuracoes.service.ts](file://backend/configuracoes/configuracoes.service.ts#L1-L331)
- [permission.service.ts](file://backend/shared/services/permission.service.ts#L1-L313)
- [permission.guard.ts](file://backend/shared/guards/permission.guard.ts#L1-L58)
- [available-permissions.ts](file://backend/shared/constants/available-permissions.ts#L1-L164)

## Visão Geral da Arquitetura
O módulo utiliza:
- PostgreSQL com extensão UUID e JSON/JSONB
- Migrações controladas por scripts SQL
- Seeds para dados iniciais
- Prisma para acesso a dados nos serviços
- Guardas de permissão baseadas em recursos e ações
- Cache de permissões com TTL

```mermaid
graph TB
Client["Aplicação Frontend"]
API["NestJS Controllers"]
OS["OrdensService"]
CL["ClientesService"]
PR["ProdutosService"]
CO["ConfiguracoesService"]
PS["PermissionService"]
PG["PermissionGuard"]
DB["PostgreSQL"]
Client --> API
API --> OS
API --> CL
API --> PR
API --> CO
API --> PS
API --> PG
OS --> DB
CL --> DB
PR --> DB
CO --> DB
PS --> DB
PG --> PS
```

**Diagrama Fonte**
- [ordem_servico.module.ts](file://backend/ordem_servico.module.ts#L1-L35)
- [ordens.service.ts](file://backend/ordens/ordens.service.ts#L1-L1148)
- [clientes.service.ts](file://backend/clientes/clientes.service.ts#L1-L253)
- [produtos.service.ts](file://backend/produtos/produtos.service.ts#L1-L169)
- [configuracoes.service.ts](file://backend/configuracoes/configuracoes.service.ts#L1-L331)
- [permission.service.ts](file://backend/shared/services/permission.service.ts#L1-L313)
- [permission.guard.ts](file://backend/shared/guards/permission.guard.ts#L1-L58)

## Análise Detalhada de Componentes

### Modelo de Dados e Relacionamentos
As principais entidades são:
- Configurações do módulo
- Agendamento de notificações
- Clientes
- Produtos/Serviços
- Templates
- Permissões de usuário e perfis
- Ordens de Serviço e histórico
- Tipos de serviço e equipamento
- Papéis de usuário
- Tabelas auxiliares e sincronização

```mermaid
erDiagram
MOD_ORDEM_SERVICO_CONFIGS {
uuid id PK
text tenant_id FK
varchar key
text value
timestamp created_at
timestamp updated_at
}
MOD_ORDEM_SERVICO_NOTIFICATION_SCHEDULES {
uuid id PK
text tenant_id FK
varchar title
text content
varchar audience
varchar cron_expression
boolean enabled
timestamp created_at
timestamp updated_at
}
MOD_ORDEM_SERVICO_CLIENTS {
uuid id PK
text tenant_id FK
varchar name
varchar document
varchar phone_primary
varchar phone_secondary
varchar email
text address
varchar address_zip
varchar address_street
varchar address_number
varchar address_complement
varchar address_neighborhood
varchar address_city
varchar address_state
text observations
text image_url
boolean is_active
timestamp created_at
timestamp updated_at
timestamp deleted_at
}
MOD_ORDEM_SERVICO_PRODUCTS {
uuid id PK
text tenant_id FK
varchar code
varchar name
varchar type
decimal price
decimal cost_price
text description
text image_url
boolean is_active
timestamp created_at
timestamp updated_at
timestamp deleted_at
}
MOD_ORDEM_SERVICO_TEMPLATES {
uuid id PK
text tenant_id FK
varchar name
text content
varchar type
timestamp created_at
timestamp updated_at
text created_by
}
MOD_ORDEM_SERVICO_USER_PERMISSIONS {
uuid id PK
text tenant_id FK
text user_id
varchar resource
varchar action
boolean allowed
timestamp created_at
timestamp updated_at
text created_by
}
MOD_ORDEM_SERVICO_PROFILE_TEMPLATES {
uuid id PK
varchar name
text description
boolean is_system
timestamp created_at
timestamp updated_at
}
MOD_ORDEM_SERVICO_TEMPLATE_PERMISSIONS {
uuid id PK
uuid template_id FK
varchar resource
varchar action
boolean allowed
timestamp created_at
}
MOD_ORDEM_SERVICO_PERMISSION_AUDIT {
uuid id PK
text tenant_id FK
text user_id
varchar resource
varchar action
boolean old_value
boolean new_value
text changed_by
timestamp changed_at
text reason
}
MOD_ORDEM_SERVICO_PROFILE_PERMISSIONS {
uuid id PK
text tenant_id FK
text permission_id
varchar profile
boolean allowed
timestamp created_at
timestamp updated_at
}
MOD_ORDEM_SERVICO_ORDENS {
uuid id PK
text tenant_id FK
text numero
uuid cliente_id FK
text usuario_responsavel_id
text tipo_servico
text descricao
text observacoes_internas
text observacoes_cliente
decimal valor_servico
text forma_pagamento
integer status
varchar prioridade
timestamp data_abertura
timestamp data_previsao
timestamp data_conclusao
varchar origem_solicitacao
boolean orcamento_aprovado
text motivo_cancelamento
text equipamento_tipo
text equipamento_marca
text equipamento_modelo
text equipamento_serie
text equipamento_acessorios
text equipamento_estado
text equipamento_fotos
text laudo_tecnico
text itens
text formatacao_so
boolean formatacao_backup
text formatacao_backup_descricao
text formatacao_senha
timestamp created_at
timestamp updated_at
}
MOD_ORDEM_SERVICO_HISTORICO {
uuid id PK
text tenant_id FK
uuid ordem_servico_id FK
text usuario_id
text acao
text valor_anterior
text valor_novo
text observacoes
timestamp created_at
}
MOD_ORDEM_SERVICO_TIPOS_SERVICO {
uuid id PK
text tenant_id FK
varchar nome
boolean is_default
timestamp created_at
}
MOD_ORDEM_SERVICO_TIPOS_EQUIPAMENTO {
uuid id PK
text tenant_id FK
varchar nome
timestamp created_at
}
MOD_ORDEM_SERVICO_USER_ROLES {
uuid id PK
text tenant_id FK
text user_id
boolean is_technician
boolean is_attendant
boolean is_admin
timestamp created_at
timestamp updated_at
}
MOD_ORDEM_SERVICO_STAFF {
uuid id PK
text user_id
boolean is_technician
timestamp created_at
timestamp updated_at
}
MOD_ORDEM_SERVICO_NOTIFICATION_SCHEDULES_2 {
uuid id PK
text tenant_id FK
uuid ordem_id FK
text type
timestamp scheduled_for
text status
text error_message
jsonb metadata
timestamp created_at
timestamp updated_at
}
MOD_ORDEM_SERVICO_CONFIGS ||--o{ MOD_ORDEM_SERVICO_ORDENS : "tenant_id"
MOD_ORDEM_SERVICO_CLIENTS ||--o{ MOD_ORDEM_SERVICO_ORDENS : "cliente_id"
MOD_ORDEM_SERVICO_USER_PERMISSIONS ||--o{ MOD_ORDEM_SERVICO_PERMISSION_AUDIT : "user_id"
MOD_ORDEM_SERVICO_PROFILE_TEMPLATES ||--o{ MOD_ORDEM_SERVICO_TEMPLATE_PERMISSIONS : "template_id"
MOD_ORDEM_SERVICO_ORDENS ||--o{ MOD_ORDEM_SERVICO_HISTORICO : "ordem_servico_id"
MOD_ORDEM_SERVICO_TIPOS_SERVICO ||..|| MOD_ORDEM_SERVICO_ORDENS : "tipo_servico"
MOD_ORDEM_SERVICO_TIPOS_EQUIPAMENTO ||..|| MOD_ORDEM_SERVICO_ORDENS : "equipamento_tipo"
MOD_ORDEM_SERVICO_USER_ROLES ||..|| MOD_ORDEM_SERVICO_ORDENS : "usuario_responsavel_id"
MOD_ORDEM_SERVICO_STAFF ||..|| MOD_ORDEM_SERVICO_ORDENS : "usuario_responsavel_id"
MOD_ORDEM_SERVICO_NOTIFICATION_SCHEDULES_2 ||..|| MOD_ORDEM_SERVICO_ORDENS : "ordem_id"
```

**Diagrama Fonte**
- [001_master.sql](file://backend/migrations/001_master.sql#L12-L320)
- [004_add_tables_os.sql](file://backend/migrations/004_add_tables_os.sql#L7-L32)

**Seção Fonte**
- [001_master.sql](file://backend/migrations/001_master.sql#L12-L320)
- [004_add_tables_os.sql](file://backend/migrations/004_add_tables_os.sql#L7-L32)

### Chaves Primárias, Estrangeiras, Índices e Restrições
- Chaves primárias: UUIDs para todas as tabelas principais
- Chaves estrangeiras: ligam entidades ao tenant e a outras entidades quando aplicável
- Índices: criados para otimizar buscas em tenant_id, campos de busca e relacionamentos
- Restrições: CHECK para status e origem de solicitação, UNIQUE para códigos de produtos e numeração de ordens

**Seção Fonte**
- [001_master.sql](file://backend/migrations/001_master.sql#L20-L249)
- [001_master.sql](file://backend/migrations/001_master.sql#L325-L396)
- [003_add_print_fields.sql](file://backend/migrations/003_add_print_fields.sql#L6-L9)
- [004_add_tables_os.sql](file://backend/migrations/004_add_tables_os.sql#L36-L42)

### Regras de Validação de Dados e Regras de Negócio
- Validação manual em serviços (ex: ordens) com sanitização de entradas e limites de paginação
- Transições de status controladas e regras específicas para finalização
- Unicidade de códigos de produtos e numeração de ordens
- Campos JSON armazenados como JSON/JSONB com tratamento seguro
- Validação de UUIDs e datas
- Regras de negócio para garantia e condições de execução

**Seção Fonte**
- [ordens.service.ts](file://backend/ordens/ordens.service.ts#L125-L135)
- [ordens.service.ts](file://backend/ordens/ordens.service.ts#L145-L209)
- [ordens.service.ts](file://backend/ordens/ordens.service.ts#L680-L700)
- [produtos.service.ts](file://backend/produtos/produtos.service.ts#L64-L68)
- [003_add_print_fields.sql](file://backend/migrations/003_add_print_fields.sql#L9-L23)

### Padrões de Acesso a Dados, Estratégias de Cache e Desempenho
- Acesso a dados via Prisma com consultas SQL brutas para performance e flexibilidade
- Cache de permissões com TTL de 5 minutos
- Índices estratégicos para buscas e relacionamentos
- Paginação com limites máximos e proteção contra buscas muito curtas

**Seção Fonte**
- [permission.service.ts](file://backend/shared/services/permission.service.ts#L16-L17)
- [permission.service.ts](file://backend/shared/services/permission.service.ts#L21-L68)
- [ordens.service.ts](file://backend/ordens/ordens.service.ts#L163-L166)
- [ordens.service.ts](file://backend/ordens/ordens.service.ts#L220-L234)

### Ciclo de Vida dos Dados, Políticas de Retenção e Arquivamento
- Soft delete com deleted_at em clientes e produtos
- Histórico de ordens registrado em tabela separada
- Configurações de módulo armazenadas em tabela de configurações
- Seeds populam dados iniciais e padrões

**Seção Fonte**
- [001_master.sql](file://backend/migrations/001_master.sql#L67-L93)
- [001_master.sql](file://backend/migrations/001_master.sql#L252-L268)
- [001_master.sql](file://backend/migrations/001_master.sql#L433-L476)
- [001_master.sql](file://backend/migrations/001_master.sql#L560-L602)
- [seed.sql](file://backend/seeds/seed.sql#L3-L17)
- [seeds_os.sql](file://backend/seeds/seeds_os.sql#L7-L26)

### Migrações e Gerenciamento de Versões
- Migrações sequenciais: master, adição de campos de impressão, sincronização de tabelas
- Seeds de permissões e dados iniciais
- Tabelas de staff e notificações sincronizadas entre ambientes

**Seção Fonte**
- [001_master.sql](file://backend/migrations/001_master.sql#L1-L622)
- [003_add_print_fields.sql](file://backend/migrations/003_add_print_fields.sql#L1-L24)
- [004_add_tables_os.sql](file://backend/migrations/004_add_tables_os.sql#L1-L80)
- [permissions_seed.sql](file://backend/seeds/permissions_seed.sql#L1-L329)

### Segurança de Dados, Privacidade e Controle de Acesso
- Permissões granulares por recurso e ação
- Guarda de permissão em rotas
- Auditoria de mudanças de permissões
- BYPASS automático para ADMIN/SUPER_ADMIN
- Máscara de chaves de API em configurações

**Seção Fonte**
- [available-permissions.ts](file://backend/shared/constants/available-permissions.ts#L1-L164)
- [permission.service.ts](file://backend/shared/services/permission.service.ts#L131-L162)
- [permission.service.ts](file://backend/shared/services/permission.service.ts#L221-L241)
- [permission.guard.ts](file://backend/shared/guards/permission.guard.ts#L1-L58)
- [configuracoes.service.ts](file://backend/configuracoes/configuracoes.service.ts#L194-L196)

## Análise de Dependências
O módulo depende do Prisma e de módulos do núcleo. Os serviços utilizam Prisma para acesso a dados e implementam regras de negócio. As guardas de permissão dependem do serviço de permissões.

```mermaid
graph LR
PRISMA["@core/prisma/prisma.module"]
AUDIT["@core/audit/audit.module"]
SHARED["shared.module.ts"]
CORE["core.module.ts"]
OS["ordens.module.ts"]
CL["clientes.module.ts"]
PR["produtos.module.ts"]
CO["configuracoes.module.ts"]
MOD["ordem_servico.module.ts"] --> PRISMA
MOD --> AUDIT
MOD --> SHARED
MOD --> CORE
MOD --> OS
MOD --> CL
MOD --> PR
MOD --> CO
```

**Diagrama Fonte**
- [ordem_servico.module.ts](file://backend/ordem_servico.module.ts#L1-L35)

**Seção Fonte**
- [ordem_servico.module.ts](file://backend/ordem_servico.module.ts#L1-L35)

## Considerações de Desempenho
- Uso de índices para tenant_id, campos de busca e relacionamentos
- Paginação com limites máximos
- Cache de permissões com TTL
- Queries otimizadas com parâmetros posicionais
- Evitar buscas muito curtas para performance

[Sem fonte específica, pois esta seção fornece orientações gerais]

## Guia de Solução de Problemas
- Erros de serialização em dados de ordens: verificação e tratamento de JSON
- Buscas muito curtas bloqueadas: aumentar o tamanho mínimo de busca
- Erros de tabela não encontrada ao excluir cliente: verificação condicional para tabelas ausentes
- Erros de permissão: auditoria de tentativas negadas e BYPASS para admins

**Seção Fonte**
- [ordens.service.ts](file://backend/ordens/ordens.service.ts#L422-L437)
- [ordens.service.ts](file://backend/ordens/ordens.service.ts#L221-L223)
- [clientes.service.ts](file://backend/clientes/clientes.service.ts#L225-L236)
- [permission.service.ts](file://backend/shared/services/permission.service.ts#L243-L259)

## Conclusão
O módulo de Ordens de Serviço possui um modelo de dados bem estruturado com entidades claras, relacionamentos consistentes, regras de validação e regras de negócio implementadas nos serviços. As migrações e seeds garantem a consistência e disponibilidade de dados iniciais. O sistema de permissões granular, cache e índices contribuem para desempenho e segurança. Recomenda-se manter os scripts de migração e seeds atualizados e seguir as práticas de validação e auditoria já implementadas.

[Sem fonte específica, pois esta seção resume sem análise de arquivos específicos]

## Apêndices

### Exemplos de Dados Iniciais
- Configurações iniciais de módulo e versão
- Seeds de condições de execução e termos
- Permissões padrão para perfis admin, técnico e atendente

**Seção Fonte**
- [seed.sql](file://backend/seeds/seed.sql#L3-L17)
- [seeds_os.sql](file://backend/seeds/seeds_os.sql#L7-L26)
- [permissions_seed.sql](file://backend/seeds/permissions_seed.sql#L12-L16)

### Sequência de Fluxo: Geração de PDF de Ordem de Serviço
```mermaid
sequenceDiagram
participant Client as "Cliente"
participant Service as "OrdensService"
participant DB as "PrismaService"
participant Browser as "Puppeteer"
Client->>Service : "gerarPDF(tenantId, ordemId)"
Service->>DB : "findOne(ordemId, tenantId)"
DB-->>Service : "dados da ordem"
Service->>DB : "busca tenant e configurações"
DB-->>Service : "tenant e condições de execução"
Service->>Browser : "gerar HTML e PDF"
Browser-->>Service : "buffer PDF"
Service-->>Client : "PDF gerado"
```

**Diagrama Fonte**
- [ordens.service.ts](file://backend/ordens/ordens.service.ts#L16-L123)

### Fluxo de Validação de Status de Ordem de Serviço
```mermaid
flowchart TD
Start(["Início"]) --> Load["Carregar ordem atual"]
Load --> CheckStatus{"Status atual e novo status válidos?"}
CheckStatus --> |Não| Error["Lançar erro de transição inválida"]
CheckStatus --> |Sim| Finalizar{"Status destino é FINALIZADA?"}
Finalizar --> |Sim| ValidateValue["Validar valor do serviço"]
ValidateValue --> ValueOK{"Valor válido?"}
ValueOK --> |Não| Error
ValueOK --> |Sim| SetConcluded["Definir data de conclusão"]
Finalizar --> |Não| Update["Atualizar status"]
SetConcluded --> Update
Update --> End(["Fim"])
Error --> End
```

**Diagrama Fonte**
- [ordens.service.ts](file://backend/ordens/ordens.service.ts#L680-L700)
- [ordens.service.ts](file://backend/ordens/ordens.service.ts#L687-L696)