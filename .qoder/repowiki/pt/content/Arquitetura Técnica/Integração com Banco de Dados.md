# Integração com Banco de Dados

<cite>
**Arquivos Referenciados neste Documento**
- [001_master.sql](file://backend/migrations/001_master.sql)
- [003_add_print_fields.sql](file://backend/migrations/003_add_print_fields.sql)
- [004_add_tables_os.sql](file://backend/migrations/004_add_tables_os.sql)
- [seed.sql](file://backend/seeds/seed.sql)
- [seeds_os.sql](file://backend/seeds/seeds_os.sql)
- [ordens.service.ts](file://backend/ordens/ordens.service.ts)
- [ordens.controller.ts](file://backend/ordens/ordens.controller.ts)
- [ordem-servico.dto.ts](file://backend/shared/dto/ordem-servico.dto.ts)
- [README.md](file://backend/README.md)
</cite>

## Sumário
1. [Introdução](#introdução)
2. [Estrutura do Banco de Dados](#estrutura-do-banco-de-dados)
3. [Migrações e Seeds](#migrações-e-seeds)
4. [ORM e Acesso aos Dados](#orm-e-acesso-aos-dados)
5. [Consultas Complexas, Joins e Índices](#consultas-complexas-joins-e-índices)
6. [Práticas de Manipulação de Dados e Transações](#práticas-de-manipulação-de-dados-e-transações)
7. [Tratamento de Erros](#tratamento-de-erros)
8. [Exemplos de Consultas Comuns](#exemplos-de-consultas-comuns)
9. [Otimização de Performance](#otimização-de-performance)
10. [Backup, Recuperação e Manutenção](#backup-recuperação-e-manutenção)
11. [Conclusão](#conclusão)

## Introdução
Este documento apresenta a integração com o banco de dados PostgreSQL no módulo de Ordens de Serviço. Ele descreve o esquema de banco de dados, tabelas principais e relacionamentos, o uso de migrações e seeds, o acesso aos dados via Prisma (com uso de consultas SQL bruto em cenários específicos), consultas complexas, joins, índices, práticas de manipulação de dados, transações, tratamento de erros, exemplos de consultas comuns e dicas de otimização de performance. Também aborda backup, recuperação e manutenção do banco de dados.

## Estrutura do Banco de Dados
O módulo define um conjunto de tabelas para gerenciar configurações, clientes, produtos/serviços, notificações, ordens de serviço, histórico, tipos de serviços/equipamentos e papéis de usuários. As principais entidades são:

- Configurações do módulo
- Clientes
- Produtos/Serviços
- Templates
- Tabelas de permissões (usuários, perfis, templates e auditoria)
- Ordens de Serviço
- Histórico de Ordens
- Tipos de Serviço e Equipamento
- Papéis de Usuários no módulo

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
text prioridade
timestamp data_abertura
timestamp data_previsao
timestamp data_conclusao
text origem_solicitacao
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
integer garantia_dias
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
MOD_ORDEM_SERVICO_STAFF {
uuid id PK
text user_id
boolean is_technician
timestamp created_at
timestamp updated_at
}
MOD_ORDEMSERVICO_NOTIFICATION_SCHEDULES {
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
TENANTS ||--o{ MOD_ORDEM_SERVICO_CONFIGS : "tem"
TENANTS ||--o{ MOD_ORDEM_SERVICO_CLIENTS : "tem"
TENANTS ||--o{ MOD_ORDEM_SERVICO_PRODUCTS : "tem"
TENANTS ||--o{ MOD_ORDEM_SERVICO_NOTIFICATION_SCHEDULES : "tem"
TENANTS ||--o{ MOD_ORDEM_SERVICO_ORDENS : "tem"
TENANTS ||--o{ MOD_ORDEM_SERVICO_HISTORICO : "tem"
TENANTS ||--o{ MOD_ORDEM_SERVICO_TIPOS_SERVICO : "tem"
TENANTS ||--o{ MOD_ORDEM_SERVICO_TIPOS_EQUIPAMENTO : "tem"
TENANTS ||--o{ MOD_ORDEM_SERVICO_USER_ROLES : "tem"
TENANTS ||--o{ MOD_ORDEM_SERVICO_TEMPLATES : "tem"
TENANTS ||--o{ MOD_ORDEM_SERVICO_USER_PERMISSIONS : "tem"
MOD_ORDEM_SERVICO_PROFILE_TEMPLATES ||--o{ MOD_ORDEM_SERVICO_TEMPLATE_PERMISSIONS : "tem"
TENANTS ||--o{ MOD_ORDEM_SERVICO_PROFILE_PERMISSIONS : "tem"
USERS ||--o{ MOD_ORDEM_SERVICO_STAFF : "contém"
MOD_ORDEM_SERVICO_ORDENS ||--o{ MOD_ORDEM_SERVICO_HISTORICO : "gera"
MOD_ORDEM_SERVICO_CLIENTS ||--o{ MOD_ORDEM_SERVICO_ORDENS : "relaciona"
```

**Diagrama fonte**
- [001_master.sql](file://backend/migrations/001_master.sql#L12-L249)
- [004_add_tables_os.sql](file://backend/migrations/004_add_tables_os.sql#L7-L32)

**Seção fonte**
- [001_master.sql](file://backend/migrations/001_master.sql#L1-L622)
- [004_add_tables_os.sql](file://backend/migrations/004_add_tables_os.sql#L1-L80)

## Migrações e Seeds
- Migrações: O projeto possui três migrações principais:
  - 001_master.sql: Criação completa do esquema do módulo, incluindo tabelas, índices e dados iniciais.
  - 003_add_print_fields.sql: Adiciona campos para impressão e configurações padrão.
  - 004_add_tables_os.sql: Adiciona tabelas ausentes em alguns ambientes e sincroniza campos e triggers.
- Seeds: Existem seeds para dados iniciais do módulo e para configurações específicas do módulo de ordens de serviço.

```mermaid
flowchart TD
Start(["Início"]) --> Master["Aplicar 001_master.sql"]
Master --> PrintFields["Aplicar 003_add_print_fields.sql"]
PrintFields --> SyncTables["Aplicar 004_add_tables_os.sql"]
SyncTables --> SeedModule["Rodar seed.sql (módulo)"]
SeedModule --> SeedOS["Rodar seeds_os.sql (ordens de serviço)"]
SeedOS --> End(["Fim"])
```

**Diagrama fonte**
- [001_master.sql](file://backend/migrations/001_master.sql#L1-L622)
- [003_add_print_fields.sql](file://backend/migrations/003_add_print_fields.sql#L1-L24)
- [004_add_tables_os.sql](file://backend/migrations/004_add_tables_os.sql#L1-L80)
- [seed.sql](file://backend/seeds/seed.sql#L1-L18)
- [seeds_os.sql](file://backend/seeds/seeds_os.sql#L1-L69)

**Seção fonte**
- [001_master.sql](file://backend/migrations/001_master.sql#L1-L622)
- [003_add_print_fields.sql](file://backend/migrations/003_add_print_fields.sql#L1-L24)
- [004_add_tables_os.sql](file://backend/migrations/004_add_tables_os.sql#L1-L80)
- [seed.sql](file://backend/seeds/seed.sql#L1-L18)
- [seeds_os.sql](file://backend/seeds/seeds_os.sql#L1-L69)

## ORM e Acesso aos Dados
- O módulo utiliza PrismaService para acesso ao banco de dados.
- Em alguns casos, consultas SQL bruto são utilizadas para maior controle (ex: geração de PDF, buscas avançadas com joins).
- O serviço de ordens implementa métodos para:
  - Listagem com paginação e filtros complexos
  - Busca individual com joins
  - Criação e atualização com validações e tratamento de JSON
  - Geração de PDF com dados combinados de ordens, tenants e configurações

```mermaid
sequenceDiagram
participant C as "Controller"
participant S as "OrdensService"
participant P as "PrismaService"
C->>S : findAll(tenantId, filters)
S->>P : $queryRawUnsafe(countQuery, ...params)
S->>P : $queryRawUnsafe(mainQuery, ...params)
P-->>S : Resultados
S-->>C : Lista paginada
C->>S : findOne(tenantId, id)
S->>P : $queryRawUnsafe(query, id, tenantId)
P-->>S : Registro
S-->>C : Detalhe
```

**Diagrama fonte**
- [ordens.controller.ts](file://backend/ordens/ordens.controller.ts#L34-L55)
- [ordens.service.ts](file://backend/ordens/ordens.service.ts#L137-L473)
- [ordens.service.ts](file://backend/ordens/ordens.service.ts#L475-L555)

**Seção fonte**
- [ordens.controller.ts](file://backend/ordens/ordens.controller.ts#L1-L377)
- [ordens.service.ts](file://backend/ordens/ordens.service.ts#L1-L123)
- [ordens.service.ts](file://backend/ordens/ordens.service.ts#L137-L555)

## Consultas Complexas, Joins e Índices
- Consultas complexas:
  - Busca com múltiplos filtros (busca textual, status, cliente, responsável, datas, origem, tipo de serviço).
  - Joins com clientes e usuários para enriquecer os dados retornados.
  - Uso de parâmetros posicionais e sanitização manual para evitar injeção.
- Índices:
  - Índices criados para otimizar buscas em tenant_id, status, data_abertura, número, cliente_id, usuário responsável, etc.
  - Índices em campos de texto e enum para melhorar desempenho de consultas.

```mermaid
flowchart TD
Start(["Entrada: Filtros"]) --> BuildWhere["Montar cláusula WHERE dinamicamente"]
BuildWhere --> ApplySearch{"Busca textual?"}
ApplySearch --> |Sim| AddSearch["Adicionar LIKE em número, nome e descrição"]
ApplySearch --> |Não| NextFilters["Próximos filtros"]
AddSearch --> NextFilters
NextFilters --> ApplyStatus{"Status array?"}
ApplyStatus --> |Sim| AddStatus["Adicionar ANY(status)"]
ApplyStatus --> |Não| ApplyDates["Datas início/fim"]
AddStatus --> ApplyDates
ApplyDates --> ApplyOther["Demais filtros (cliente, responsável, origem, tipo)"]
ApplyOther --> CountQuery["Executar COUNT com WHERE"]
CountQuery --> MainQuery["Executar SELECT principal com LIMIT/OFFSET"]
MainQuery --> End(["Retorno paginado"])
```

**Diagrama fonte**
- [ordens.service.ts](file://backend/ordens/ordens.service.ts#L211-L280)
- [ordens.service.ts](file://backend/ordens/ordens.service.ts#L281-L321)

**Seção fonte**
- [ordens.service.ts](file://backend/ordens/ordens.service.ts#L137-L321)
- [001_master.sql](file://backend/migrations/001_master.sql#L322-L396)

## Práticas de Manipulação de Dados e Transações
- Validação e sanitização de entradas:
  - Validação manual de UUIDs, datas, arrays e strings.
  - Limites de tamanho e caracteres especiais removidos.
- Persistência de dados:
  - Criação e atualização com tratamento de JSON (itens, fotos).
  - Validação de status e transições permitidas.
- Histórico:
  - Registros de histórico de alterações com valores antigos e novos.
- PDF:
  - Geração com Puppeteer usando dados combinados de ordens, tenants e configurações.

```mermaid
sequenceDiagram
participant S as "OrdensService"
participant P as "PrismaService"
participant H as "Histórico"
S->>S : validarTransicaoStatus()
alt Status válido
S->>P : UPDATE mod_ordem_servico_ordens
P-->>S : Linhas afetadas
S->>H : registrarAlteracoesHistorico()
H-->>S : OK
S-->>S : OK
else Inválido
S-->>S : Erro
end
```

**Diagrama fonte**
- [ordens.service.ts](file://backend/ordens/ordens.service.ts#L656-L770)
- [ordens.service.ts](file://backend/ordens/ordens.service.ts#L126-L135)

**Seção fonte**
- [ordens.service.ts](file://backend/ordens/ordens.service.ts#L656-L770)
- [ordens.service.ts](file://backend/ordens/ordens.service.ts#L126-L135)

## Tratamento de Erros
- Logs detalhados em todos os métodos críticos.
- Validação rigorosa de entrada e tipos.
- Tratamento de erros em operações de leitura, escrita e geração de PDF.
- Exceções lançadas com mensagens informativas.

**Seção fonte**
- [ordens.service.ts](file://backend/ordens/ordens.service.ts#L16-L123)
- [ordens.service.ts](file://backend/ordens/ordens.service.ts#L468-L472)

## Exemplos de Consultas Comuns
- Listagem de ordens com paginação e filtros:
  - Busca textual em número, nome do cliente e descrição.
  - Filtragem por status, cliente, responsável, datas, origem e tipo de serviço.
- Detalhe de ordem com joins:
  - Informações da ordem, cliente e responsável.
- Criação de ordem:
  - Geração de número sequencial, definição de status inicial e persistência de dados JSON.
- Atualização de status:
  - Validação de transição permitida e campos obrigatórios para finalização/cancelamento.

**Seção fonte**
- [ordens.service.ts](file://backend/ordens/ordens.service.ts#L137-L473)
- [ordens.service.ts](file://backend/ordens/ordens.service.ts#L475-L555)
- [ordens.service.ts](file://backend/ordens/ordens.service.ts#L557-L654)
- [ordens.service.ts](file://backend/ordens/ordens.service.ts#L772-L800)

## Otimização de Performance
- Índices estratégicos:
  - Tenant, status, data de abertura, número, cliente_id, usuário responsável.
- Consultas paginadas:
  - COUNT separado e LIMIT/OFFSET no resultado principal.
- Sanitização e parâmetros posicionais:
  - Evita injeção e melhora cache de planos de consulta.
- Uso de JSONB:
  - Armazenamento de arrays e objetos em campos JSONB para flexibilidade.

**Seção fonte**
- [001_master.sql](file://backend/migrations/001_master.sql#L322-L396)
- [ordens.service.ts](file://backend/ordens/ordens.service.ts#L137-L321)

## Backup, Recuperação e Manutenção
- Backup:
  - Utilize ferramentas de backup do PostgreSQL (ex: pg_dump) para exportar o schema e dados do módulo.
- Recuperação:
  - Restaure backups usando pg_restore ou psql para reverter mudanças indesejadas.
- Manutenção:
  - Monitore índices e desempenho com análise de consultas lentas.
  - Mantenha migrações e seeds organizadas e versionadas.
  - Revise triggers e funções de atualização automática de timestamps.

[Sem fontes, pois esta seção fornece orientações gerais]

## Conclusão
O módulo de Ordens de Serviço implementa um esquema robusto de banco de dados com migrações e seeds bem definidos. O acesso aos dados utiliza Prisma com consultas SQL bruto quando necessário, proporcionando controle sobre operações complexas como paginação, joins e geração de PDF. A estratégia de índices e validações contribui para desempenho e integridade. Recomenda-se seguir práticas de backup, recuperação e manutenção para garantir a estabilidade do ambiente.