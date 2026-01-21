# Arquitetura Técnica

<cite>
**Arquivo Referenciados Neste Documento**
- [backend/README.md](file://backend/README.md)
- [backend/module.json](file://backend/module.json)
- [backend/ordem_servico.module.ts](file://backend/ordem_servico.module.ts)
- [backend/routes.ts](file://backend/routes.ts)
- [backend/ordens/ordens.controller.ts](file://backend/ordens/ordens.controller.ts)
- [backend/ordens/ordens.service.ts](file://backend/ordens/ordens.service.ts)
- [backend/shared/dto/ordem-servico.dto.ts](file://backend/shared/dto/ordem-servico.dto.ts)
- [backend/migrations/004_add_tables_os.sql](file://backend/migrations/004_add_tables_os.sql)
- [backend/seeds/seeds_os.sql](file://backend/seeds/seeds_os.sql)
- [backend/clientes/clientes.controller.ts](file://backend/clientes/clientes.controller.ts)
- [backend/produtos/produtos.controller.ts](file://backend/produtos/produtos.controller.ts)
- [backend/configuracoes/configuracoes.controller.ts](file://backend/configuracoes/configuracoes.controller.ts)
- [backend/core/ordem-servico-config.controller.ts](file://backend/core/ordem-servico-config.controller.ts)
- [frontend/index.tsx](file://frontend/index.tsx)
- [frontend/services/ordem_servico.service.ts](file://frontend/services/ordem_servico.service.ts)
</cite>

## Sumário
1. [Introdução](#introdução)
2. [Estrutura do Projeto](#estrutura-do-projeto)
3. [Componentes Principais](#componentes-principais)
4. [Visão Geral da Arquitetura](#visão-geral-da-arquitetura)
5. [Análise Detalhada dos Componentes](#análise-detalhada-dos-componentes)
6. [Análise de Dependências](#análise-de-dependências)
7. [Considerações de Desempenho](#considerações-de-desempenho)
8. [Guia de Solução de Problemas](#guia-de-solução-de-problemas)
9. [Conclusão](#conclusão)
10. [Apêndices](#apêndices)

## Introdução
O módulo de Ordens de Serviço constitui um componente crítico de um sistema multitenant, oferecendo funcionalidades completas de gestão de ordens, acompanhamento de status, geração de documentos, integração com clientes e produtos, além de configurações avançadas de notificações e papéis de usuário. Este documento apresenta a arquitetura técnica, padrões adotados, limites do sistema, interações entre componentes, fluxos de dados e padrões de integração, além de decisões técnicas, compensações, requisitos de infraestrutura, escalabilidade, topologia de implantação, preocupações transversais e pilha tecnológica.

## Estrutura do Projeto
O módulo segue uma arquitetura modular NestJS com camadas bem definidas:
- Backend: módulos de Ordens, Clientes, Produtos, Configurações, Core e Shared.
- Frontend: componentes React com serviços de integração à API.
- Infraestrutura: migrações e seeds para inicialização do esquema de dados.

```mermaid
graph TB
subgraph "Backend"
OSModule["OrdemServicoModule<br/>Módulo Principal"]
Ordens["OrdensModule<br/>Controllers/Services"]
ClientesModule["ClientesModule<br/>Controllers/Services"]
ProdutosModule["ProdutosModule<br/>Controllers/Services"]
ConfiguracoesModule["ConfiguracoesModule<br/>Controllers/Services"]
CoreModule["CoreModule<br/>Configurações Avançadas"]
SharedModule["SharedModule<br/>DTOs/Guardas/Decorators"]
end
subgraph "Frontend"
FrontIndex["frontend/index.tsx<br/>Definição do Módulo"]
Services["frontend/services/ordem_servico.service.ts<br/>Integração API"]
end
OSModule --> Ordens
OSModule --> ClientesModule
OSModule --> ProdutosModule
OSModule --> ConfiguracoesModule
OSModule --> CoreModule
OSModule --> SharedModule
FrontIndex --> Services
Services --> OSModule
```

**Diagrama fonte**
- [backend/ordem_servico.module.ts](file://backend/ordem_servico.module.ts#L11-L30)
- [backend/routes.ts](file://backend/routes.ts#L9-L17)
- [frontend/index.tsx](file://frontend/index.tsx#L6-L21)

**Fontes da seção**
- [backend/README.md](file://backend/README.md#L1-L59)
- [backend/module.json](file://backend/module.json#L1-L48)

## Componentes Principais
- Módulo Principal: OrdemServicoModule, que importa e exporta os demais módulos.
- Controllers: OrdemServicoConfigController, OrdensController, ClientesController, ProdutosController, ConfiguracoesController.
- Services: OrdensService, ClientesService, ProdutosService, ConfiguracoesService, OrdemServicoCronService.
- DTOs: Tipos e validações para requisições e respostas.
- Mapeamento de Rotas: Routes.ts define os controladores expostos.
- Frontend: index.tsx e ordem_servico.service.ts para integração com a API.

**Fontes da seção**
- [backend/ordem_servico.module.ts](file://backend/ordem_servico.module.ts#L1-L35)
- [backend/routes.ts](file://backend/routes.ts#L1-L17)
- [backend/shared/dto/ordem-servico.dto.ts](file://backend/shared/dto/ordem-servico.dto.ts#L1-L397)
- [frontend/index.tsx](file://frontend/index.tsx#L1-L22)
- [frontend/services/ordem_servico.service.ts](file://frontend/services/ordem_servico.service.ts#L1-L20)

## Visão Geral da Arquitetura
A arquitetura adota o padrão de módulos NestJS com separação de responsabilidades:
- Controladores: lidam com requisições HTTP, validações e autenticação.
- Serviços: implementam a lógica de negócio, integrações e persistência.
- DTOs: validação e tipagem de dados de entrada/saída.
- Módulos: encapsulamento de funcionalidades e exportação de dependências.
- Frontend: comunicação assíncrona com a API REST.

```mermaid
graph TB
Client["Frontend (React)"]
API["API REST (NestJS)"]
Services["Serviços de Negócio"]
DB[("Banco de Dados")]
PDF["Geração de PDF<br/>Puppeteer"]
Client --> API
API --> Services
Services --> DB
Services --> PDF
```

**Diagrama fonte**
- [backend/ordens/ordens.controller.ts](file://backend/ordens/ordens.controller.ts#L25-L377)
- [backend/ordens/ordens.service.ts](file://backend/ordens/ordens.service.ts#L15-L123)

## Análise Detalhada dos Componentes

### Controller de Ordens de Serviço
Responsável pelas operações CRUD, geração de PDF, upload de arquivos, histórico e validações de status.

```mermaid
sequenceDiagram
participant FE as "Frontend"
participant Ctrl as "OrdensController"
participant Svc as "OrdensService"
participant DB as "PrismaService"
FE->>Ctrl : GET /api/ordem_servico/ordens
Ctrl->>Svc : findAll(tenantId, filters)
Svc->>DB : queryRawUnsafe(...)
DB-->>Svc : resultados
Svc-->>Ctrl : dados paginados
Ctrl-->>FE : OrdemServicoListResponseDTO
FE->>Ctrl : POST /api/ordem_servico/ordens
Ctrl->>Svc : create(tenantId, userId, dto)
Svc->>DB : insert(...)
DB-->>Svc : nova ordem
Svc-->>Ctrl : ordem criada
Ctrl-->>FE : OrdemServicoResponseDTO
```

**Diagrama fonte**
- [backend/ordens/ordens.controller.ts](file://backend/ordens/ordens.controller.ts#L34-L179)
- [backend/ordens/ordens.service.ts](file://backend/ordens/ordens.service.ts#L137-L473)

**Fontes da seção**
- [backend/ordens/ordens.controller.ts](file://backend/ordens/ordens.controller.ts#L1-L377)
- [backend/ordens/ordens.service.ts](file://backend/ordens/ordens.service.ts#L1-L800)

### Serviço de Ordens de Serviço
Implementa a lógica de negócio, geração de PDF com Puppeteer, validações de status e histórico.

```mermaid
flowchart TD
Start(["Entrada: generatePdf(tenantId, id)"]) --> FindOS["Buscar ordem e cliente"]
FindOS --> FetchTenant["Consultar configurações do tenant"]
FetchTenant --> BuildHTML["Gerar HTML com template"]
BuildHTML --> LaunchPuppeteer["Iniciar Puppeteer headless"]
LaunchPuppeteer --> Render["Renderizar conteúdo HTML"]
Render --> CreatePDF["Gerar PDF A4"]
CreatePDF --> CloseBrowser["Fechar navegador"]
CloseBrowser --> Return(["Retornar Buffer PDF"])
```

**Diagrama fonte**
- [backend/ordens/ordens.service.ts](file://backend/ordens/ordens.service.ts#L15-L123)

**Fontes da seção**
- [backend/ordens/ordens.service.ts](file://backend/ordens/ordens.service.ts#L15-L123)

### DTOs de Ordens de Serviço
Define enums de status e origem, DTOs de criação/atualização, filtros de consulta e DTOs de resposta.

```mermaid
classDiagram
class StatusOS {
<<enum>>
+ORCAMENTO
+ABERTA
+EM_ANALISE
+AGUARDANDO_CLIENTE
+AGUARDANDO_PECAS
+EM_EXECUCAO
+FINALIZADA
+CANCELADA
}
class OrigemSolicitacao {
<<enum>>
+WHATSAPP
+PRESENCIAL
+SISTEMA
}
class CreateOrdemServicoDTO {
+string cliente_id
+string tipo_servico
+string prioridade
+string descricao
+number valor_servico
+string forma_pagamento
+string data_previsao
+OrigemSolicitacao origem_solicitacao
+StatusOS status
+string laudo_tecnico
+string usuario_responsavel_id
+string equipamento_tipo
+string equipamento_marca
+string equipamento_modelo
+string equipamento_serie
+string equipamento_acessorios
+string equipamento_estado
+boolean formatacao_backup
+string formatacao_backup_descricao
+string formatacao_senha
+string[] equipamento_fotos
+ItemOrdem[] itens
+number garantia_dias
}
class UpdateOrdemServicoDTO {
+string tipo_servico
+string prioridade
+string descricao
+number valor_servico
+string forma_pagamento
+string data_previsao
+string usuario_responsavel_id
+StatusOS status
+string motivo_cancelamento
+string laudo_tecnico
+string equipamento_tipo
+string equipamento_marca
+string equipamento_modelo
+string equipamento_serie
+string equipamento_acessorios
+string equipamento_estado
+boolean formatacao_backup
+string formatacao_backup_descricao
+string formatacao_senha
+string[] equipamento_fotos
+ItemOrdem[] itens
+number garantia_dias
}
class OrdemServicoFilters {
+string search
+StatusOS[] status
+string cliente_id
+string usuario_responsavel_id
+string data_inicio
+string data_fim
+OrigemSolicitacao origem_solicitacao
+string tipo_servico
+number page
+number limit
}
class OrdemServicoResponseDTO {
+string id
+string tenant_id
+string numero
+string cliente_id
+string usuario_responsavel_id
+string tipo_servico
+string descricao
+string laudo_tecnico
+string observacoes_internas
+string observacoes_cliente
+number valor_servico
+string forma_pagamento
+number status
+string prioridade
+string data_abertura
+string data_previsao
+string data_conclusao
+string origem_solicitacao
+boolean orcamento_aprovado
+string motivo_cancelamento
+string equipamento_tipo
+string equipamento_marca
+string equipamento_modelo
+string equipamento_serie
+string equipamento_acessorios
+string equipamento_estado
+string[] equipamento_fotos
+boolean formatacao_backup
+string formatacao_backup_descricao
+string formatacao_senha
+string created_at
+string updated_at
+ClienteResponseDTO cliente
+ResponsavelResponseDTO responsavel
+ItemOrdem[] itens
}
CreateOrdemServicoDTO --> StatusOS
CreateOrdemServicoDTO --> OrigemSolicitacao
UpdateOrdemServicoDTO --> StatusOS
UpdateOrdemServicoDTO --> OrigemSolicitacao
OrdemServicoFilters --> StatusOS
OrdemServicoFilters --> OrigemSolicitacao
```

**Diagrama fonte**
- [backend/shared/dto/ordem-servico.dto.ts](file://backend/shared/dto/ordem-servico.dto.ts#L1-L397)

**Fontes da seção**
- [backend/shared/dto/ordem-servico.dto.ts](file://backend/shared/dto/ordem-servico.dto.ts#L1-L397)

### Controllers de Clientes e Produtos
Controladores com permissões e upload de arquivos, com validações e tratamento de erros robusto.

```mermaid
sequenceDiagram
participant FE as "Frontend"
participant Ctrl as "ClientesController"
participant Svc as "ClientesService"
participant FS as "Sistema de Arquivos"
FE->>Ctrl : POST /api/ordem_servico/clientes/upload
Ctrl->>Ctrl : FileInterceptor
Ctrl->>FS : Salvar arquivo isolado por tenant
FS-->>Ctrl : URL pública
Ctrl-->>FE : UploadResponseDTO
```

**Diagrama fonte**
- [backend/clientes/clientes.controller.ts](file://backend/clientes/clientes.controller.ts#L74-L119)

**Fontes da seção**
- [backend/clientes/clientes.controller.ts](file://backend/clientes/clientes.controller.ts#L1-L182)
- [backend/produtos/produtos.controller.ts](file://backend/produtos/produtos.controller.ts#L1-L144)

### Configurações e Papéis
Endpoints para configurações de notificações, tipos de serviço/equipamento, usuários e papéis.

```mermaid
sequenceDiagram
participant FE as "Frontend"
participant Ctrl as "OrdemServicoConfigController"
participant DB as "PrismaService"
participant Cron as "OrdemServicoCronService"
FE->>Ctrl : POST /api/ordem_servico/config/notifications
Ctrl->>DB : INSERT notification_schedule
Ctrl->>Cron : registerNotificationJob()
Cron-->>Ctrl : job registrado
Ctrl-->>FE : confirmação
```

**Diagrama fonte**
- [backend/core/ordem-servico-config.controller.ts](file://backend/core/ordem-servico-config.controller.ts#L28-L46)

**Fontes da seção**
- [backend/core/ordem-servico-config.controller.ts](file://backend/core/ordem-servico-config.controller.ts#L1-L254)
- [backend/configuracoes/configuracoes.controller.ts](file://backend/configuracoes/configuracoes.controller.ts#L1-L136)

## Análise de Dependências
- Módulo Principal: OrdemServicoModule importa PrismaModule, AuditModule, SharedModule, CoreModule, ClientesModule, ProdutosModule, OrdensModule, ConfiguracoesModule.
- Rotas: ModuleRoutes aponta para os controladores expostos.
- Frontend: index.tsx define widgets e módulo; ordem_servico.service.ts consome endpoints da API.

```mermaid
graph TB
OSModule["OrdemServicoModule"]
Prisma["PrismaModule"]
Audit["AuditModule"]
Shared["SharedModule"]
Core["CoreModule"]
Clientes["ClientesModule"]
Produtos["ProdutosModule"]
Ordens["OrdensModule"]
Config["ConfiguracoesModule"]
OSModule --> Prisma
OSModule --> Audit
OSModule --> Shared
OSModule --> Core
OSModule --> Clientes
OSModule --> Produtos
OSModule --> Ordens
OSModule --> Config
```

**Diagrama fonte**
- [backend/ordem_servico.module.ts](file://backend/ordem_servico.module.ts#L11-L30)

**Fontes da seção**
- [backend/ordem_servico.module.ts](file://backend/ordem_servico.module.ts#L1-L35)
- [backend/routes.ts](file://backend/routes.ts#L1-L17)
- [frontend/index.tsx](file://frontend/index.tsx#L1-L22)

## Considerações de Desempenho
- Validação e sanitização de filtros: evita consultas inseguras e melhora desempenho com limites de busca e paginação.
- Paginação controlada: limites máximos e mínimos de registros por página.
- Geração de PDF: Puppeteer em modo headless com argumentos otimizados e timeouts configuráveis.
- Persistência: uso de Prisma com queries raw para maior controle e performance em operações complexas.

[Sem fontes desta seção, pois fornece orientações gerais]

## Guia de Solução de Problemas
- Erros de upload: verificação de buffer, tipos MIME e tamanhos máximos; caminhos de upload isolados por tenant.
- Validações de status: transições permitidas previamente definidas; mensagens de erro específicas para estados inválidos.
- Geração de PDF: verifique permissões de leitura de arquivos, caminho do logo e configurações do Puppeteer.

**Fontes da seção**
- [backend/ordens/ordens.controller.ts](file://backend/ordens/ordens.controller.ts#L310-L355)
- [backend/ordens/ordens.service.ts](file://backend/ordens/ordens.service.ts#L15-L123)
- [backend/clientes/clientes.controller.ts](file://backend/clientes/clientes.controller.ts#L74-L119)

## Conclusão
O módulo de Ordens de Serviço demonstra uma arquitetura sólida, com clara separação de camadas, validações rigorosas, persistência eficiente e geração de documentos automatizada. A abordagem multitenant, com papéis e permissões bem definidos, proporciona flexibilidade e segurança. As decisões técnicas priorizam robustez operacional, escalabilidade e manutenibilidade.

[Sem fontes desta seção, pois resume sem análise específica de arquivos]

## Apêndices

### Requisitos de Infraestrutura
- Backend: Node.js com NestJS, PostgreSQL, Prisma, Puppeteer.
- Frontend: React com TypeScript, bibliotecas de UI e serviços HTTP.
- Armazenamento: sistema de arquivos local para uploads (isolados por tenant).
- Segurança: JWT, guardas de permissão e papéis de usuário.

**Fontes da seção**
- [backend/README.md](file://backend/README.md#L31-L59)
- [backend/ordens/ordens.service.ts](file://backend/ordens/ordens.service.ts#L82-L95)

### Topologia de Implantação
- Backend: instância única ou cluster com balanceamento de carga, conectada ao banco de dados PostgreSQL.
- Frontend: hospedado separadamente, consumindo a API REST.
- PDF: geração local com Puppeteer; recomendado em ambiente com permissões de escrita e recursos suficientes.

**Fontes da seção**
- [backend/README.md](file://backend/README.md#L1-L59)

### Padrões de Integração
- API REST: endpoints padronizados com métodos HTTP e DTOs de entrada/saída.
- Autenticação: JWT com guardas de autenticação e permissões.
- Upload de Arquivos: multipart/form-data com validações e armazenamento isolado.

**Fontes da seção**
- [backend/ordens/ordens.controller.ts](file://backend/ordens/ordens.controller.ts#L310-L377)
- [backend/clientes/clientes.controller.ts](file://backend/clientes/clientes.controller.ts#L74-L140)
- [backend/produtos/produtos.controller.ts](file://backend/produtos/produtos.controller.ts#L63-L144)

### Migrações e Seeds
- Migrações: criação de tabelas, ajuste de campos e triggers para sincronização.
- Seeds: configurações padrão, termos e papéis iniciais.

**Fontes da seção**
- [backend/migrations/004_add_tables_os.sql](file://backend/migrations/004_add_tables_os.sql#L1-L80)
- [backend/seeds/seeds_os.sql](file://backend/seeds/seeds_os.sql#L1-L69)

### Pilha Tecnológica e Dependências
- Backend: NestJS, Prisma, Puppeteer, Express.
- Frontend: React, TypeScript, Axios.
- Banco de Dados: PostgreSQL.
- Segurança: JWT, guardas de permissão.

**Fontes da seção**
- [backend/module.json](file://backend/module.json#L1-L48)
- [backend/README.md](file://backend/README.md#L1-L59)