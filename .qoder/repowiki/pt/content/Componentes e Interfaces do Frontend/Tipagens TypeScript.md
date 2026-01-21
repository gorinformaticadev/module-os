# Tipagens TypeScript

<cite>
**Arquivos referenciados neste documento**
- [ordem-servico.types.ts](file://frontend/types/ordem-servico.types.ts)
- [permission.types.ts](file://frontend/types/permission.types.ts)
- [ordem_servico.service.ts](file://frontend/services/ordem_servico.service.ts)
- [permissionService.ts](file://frontend/services/permissionService.ts)
- [usePermission.ts](file://frontend/hooks/usePermission.ts)
- [useAI.ts](file://frontend/hooks/useAI.ts)
- [ClientEditModal.tsx](file://frontend/components/ClientEditModal.tsx)
- [ClientModal.tsx](file://frontend/components/ClientModal.tsx)
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

## Introdução
Este documento apresenta uma documentação abrangente das tipagens TypeScript do frontend do módulo de Ordens de Serviço. Ele detalha as definições de entidade, relacionamentos de campo, tipos de dados, regras de validação, restrições de negócio, padrões de acesso a dados, estratégias de cache, ciclo de vida dos dados e políticas de retenção, além de segurança de dados, requisitos de privacidade e controle de acesso.

## Estrutura do Projeto
O frontend organiza as tipagens em dois módulos principais:
- Tipagens de Ordens de Serviço: contém interfaces para entidades, enums e DTOs relacionados às ordens de serviço.
- Tipagens de Permissões: define estruturas para gerenciamento de permissões de usuários.

```mermaid
graph TB
subgraph "Tipagens"
OS["Tipagens de OS<br/>ordem-servico.types.ts"]
PERM["Tipagens de Permissões<br/>permission.types.ts"]
end
subgraph "Serviços"
OSS["Serviço OS<br/>ordem_servico.service.ts"]
PERMS["Serviço de Permissões<br/>permissionService.ts"]
end
subgraph "Hooks"
UP["Hook de Permissões<br/>usePermission.ts"]
AI["Hook de IA<br/>useAI.ts"]
end
subgraph "Componentes"
CEM["ClientEditModal<br/>ClientEditModal.tsx"]
CM["ClientModal<br/>ClientModal.tsx"]
end
OS --> OSS
PERM --> PERMS
PERM --> UP
OS --> CEM
OS --> CM
PERM --> CM
PERM --> CEM
```

**Diagrama fonte**
- [ordem-servico.types.ts](file://frontend/types/ordem-servico.types.ts#L1-L235)
- [permission.types.ts](file://frontend/types/permission.types.ts#L1-L55)
- [ordem_servico.service.ts](file://frontend/services/ordem_servico.service.ts#L1-L20)
- [permissionService.ts](file://frontend/services/permissionService.ts#L1-L135)
- [usePermission.ts](file://frontend/hooks/usePermission.ts#L1-L142)
- [useAI.ts](file://frontend/hooks/useAI.ts#L1-L41)
- [ClientEditModal.tsx](file://frontend/components/ClientEditModal.tsx#L1-L711)
- [ClientModal.tsx](file://frontend/components/ClientModal.tsx#L1-L673)

**Seção fonte**
- [ordem-servico.types.ts](file://frontend/types/ordem-servico.types.ts#L1-L235)
- [permission.types.ts](file://frontend/types/permission.types.ts#L1-L55)

## Componentes Principais

### Tipagens de Ordens de Serviço
O módulo de ordens de serviço define as seguintes entidades principais:

- **OrdemServico**: Representa uma ordem de serviço completa com campos obrigatórios e opcionais, incluindo informações do cliente, responsável, status e dados técnicos.
- **Cliente**: Dados do cliente associado à ordem de serviço.
- **Usuario**: Informações básicas do usuário responsável.
- **HistoricoOS**: Histórico de alterações de status da ordem de serviço.

```mermaid
classDiagram
class OrdemServico {
+string id
+string numero
+string tenant_id
+string cliente_id
+string usuario_responsavel_id
+string tipo_servico
+Prioridade prioridade
+string descricao
+string? laudo_tecnico
+string? observacoes_internas
+string? observacoes_cliente
+number valor_servico
+string? forma_pagamento
+StatusOS status
+string data_abertura
+string? data_previsao
+string? data_conclusao
+OrigemSolicitacao origem_solicitacao
+string? equipamento_tipo
+string? equipamento_marca
+string? equipamento_modelo
+string? equipamento_serie
+string? equipamento_acessorios
+string? equipamento_estado
+string? formatacao_so
+boolean? formatacao_backup
+string? formatacao_backup_descricao
+string? formatacao_senha
+string[]? equipamento_fotos
+boolean? orcamento_aprovado
+string? motivo_cancelamento
+string created_at
+string updated_at
+Cliente? cliente
+Usuario? usuario_responsavel
+HistoricoOS[]? historico
+any[]? itens
}
class Cliente {
+string id
+string name
+string? document
+string phone_primary
+string? phone_secondary
+string? address_street
+string? address_number
+string? address_complement
+string? address_neighborhood
+string? address_city
+string? address_state
+string? address_zip
+string? observations
+string? image_url
+boolean is_active
}
class Usuario {
+string id
+string name
+string email
+string role
}
class HistoricoOS {
+string id
+string ordem_servico_id
+string usuario_id
+string acao
+string? valor_anterior
+string? valor_novo
+string? observacoes
+string created_at
+Usuario? usuario
}
OrdemServico --> Cliente : "relaciona-se com"
OrdemServico --> Usuario : "tem responsável"
OrdemServico --> HistoricoOS : "possui histórico"
```

**Diagrama fonte**
- [ordem-servico.types.ts](file://frontend/types/ordem-servico.types.ts#L3-L48)
- [ordem-servico.types.ts](file://frontend/types/ordem-servico.types.ts#L50-L66)
- [ordem-servico.types.ts](file://frontend/types/ordem-servico.types.ts#L68-L73)
- [ordem-servico.types.ts](file://frontend/types/ordem-servico.types.ts#L75-L85)

**Seção fonte**
- [ordem-servico.types.ts](file://frontend/types/ordem-servico.types.ts#L3-L85)

### Enums e Validações
O módulo define enums para representar estados e origens de solicitação, além de constantes para rótulos e cores associados aos status.

- **StatusOS**: Estados possíveis de uma ordem de serviço.
- **OrigemSolicitacao**: Formas de origem da solicitação.
- **TipoServico**: Tipos de serviço oferecidos.
- **TRANSICOES_PERMITIDAS**: Regras de transição válidas entre status.

```mermaid
classDiagram
class StatusOS {
<<enumeration>>
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
<<enumeration>>
+WHATSAPP
+PRESENCIAL
+SISTEMA
}
class TipoServico {
<<enumeration>>
+IMPRESSAO
+FORMATACAO
+MANUTENCAO
+CRIACAO_ARTE
+CADASTRO_DIGITAL
+SUPORTE_TECNICO
+OUTROS
}
class StatusOS {
+string ORCAMENTO
+string ABERTA
+string EM_ANALISE
+string AGUARDANDO_CLIENTE
+string AGUARDANDO_PECAS
+string EM_EXECUCAO
+string FINALIZADA
+string CANCELADA
}
```

**Diagrama fonte**
- [ordem-servico.types.ts](file://frontend/types/ordem-servico.types.ts#L88-L113)

**Seção fonte**
- [ordem-servico.types.ts](file://frontend/types/ordem-servico.types.ts#L88-L164)

### DTOs de Criação e Atualização
Para operações CRUD, são definidos DTOs específicos:

- **CreateOrdemServicoDTO**: Campos necessários para criação de nova ordem de serviço.
- **UpdateOrdemServicoDTO**: Campos que podem ser atualizados em uma ordem existente.
- **OrdemServicoFilters**: Parâmetros de filtro para consultas.

```mermaid
classDiagram
class CreateOrdemServicoDTO {
+string cliente_id
+string tipo_servico
+Prioridade prioridade
+string descricao
+string? laudo_tecnico
+string? observacoes_internas
+string? observacoes_cliente
+number? valor_servico
+string? forma_pagamento
+string? data_previsao
+OrigemSolicitacao origem_solicitacao
+StatusOS? status
+string? equipamento_tipo
+string? equipamento_marca
+string? equipamento_modelo
+string? equipamento_serie
+string? equipamento_acessorios
+string? equipamento_estado
+string? formatacao_so
+boolean? formatacao_backup
+string? formatacao_backup_descricao
+string? formatacao_senha
+string[]? equipamento_fotos
}
class UpdateOrdemServicoDTO {
+string? tipo_servico
+Prioridade? prioridade
+string? descricao
+string? laudo_tecnico
+string? observacoes_internas
+string? observacoes_cliente
+number? valor_servico
+string? forma_pagamento
+string? data_previsao
+string? usuario_responsavel_id
+StatusOS? status
+string? motivo_cancelamento
+string? equipamento_tipo
+string? equipamento_marca
+string? equipamento_modelo
+string? equipamento_serie
+string? equipamento_acessorios
+string? equipamento_estado
+string? formatacao_so
+boolean? formatacao_backup
+string? formatacao_backup_descricao
+string? formatacao_senha
+string[]? equipamento_fotos
}
class OrdemServicoFilters {
+string? search
+StatusOS[]? status
+string? cliente_id
+string? usuario_responsavel_id
+string? data_inicio
+string? data_fim
+OrigemSolicitacao? origem_solicitacao
+string? tipo_servico
}
```

**Diagrama fonte**
- [ordem-servico.types.ts](file://frontend/types/ordem-servico.types.ts#L166-L194)
- [ordem-servico.types.ts](file://frontend/types/ordem-servico.types.ts#L196-L224)
- [ordem-servico.types.ts](file://frontend/types/ordem-servico.types.ts#L226-L235)

**Seção fonte**
- [ordem-servico.types.ts](file://frontend/types/ordem-servico.types.ts#L166-L235)

### Tipagens de Permissões
O módulo de permissões define estruturas para gerenciamento de acesso:

- **UserPermission**: Permissão individual de um usuário.
- **PermissionUpdate**: Dados para atualização de permissões.
- **AvailablePermission**: Recurso disponível com suas ações.
- **PermissionAction**: Ações associadas a um recurso.
- **UserWithPermissions**: Usuário com suas permissões consolidadas.
- **PermissionAudit**: Registro de auditoria de mudanças de permissão.

```mermaid
classDiagram
class UserPermission {
+string id
+string userId
+string tenantId
+string resource
+string action
+boolean allowed
+string createdAt
+string updatedAt
+string createdBy
}
class PermissionUpdate {
+string resource
+string action
+boolean allowed
}
class AvailablePermission {
+string resource
+string resourceLabel
+PermissionAction[] actions
}
class PermissionAction {
+string action
+string actionLabel
+string description
}
class UserWithPermissions {
+string id
+string name
+string email
+string role
+UserPermission[] permissions
+object permissionSummary
}
class PermissionAudit {
+string id
+string tenantId
+string userId
+string resource
+string action
+boolean? oldValue
+boolean newValue
+string changedBy
+string changedAt
+string? reason
}
```

**Diagrama fonte**
- [permission.types.ts](file://frontend/types/permission.types.ts#L1-L11)
- [permission.types.ts](file://frontend/types/permission.types.ts#L13-L17)
- [permission.types.ts](file://frontend/types/permission.types.ts#L19-L29)
- [permission.types.ts](file://frontend/types/permission.types.ts#L31-L42)
- [permission.types.ts](file://frontend/types/permission.types.ts#L44-L55)

**Seção fonte**
- [permission.types.ts](file://frontend/types/permission.types.ts#L1-L55)

## Visão Geral da Arquitetura
A arquitetura do frontend segue um padrão de separação de responsabilidades com tipagens fortemente tipadas:

```mermaid
sequenceDiagram
participant UI as "Componente React"
participant Hook as "Hook de Permissões"
participant Service as "PermissionService"
participant API as "API Backend"
UI->>Hook : usePermission(resource, action)
Hook->>Service : checkPermission(resource, action)
Service->>API : GET /modules/ordem_servico/permissions/check/{resource}/{action}
API-->>Service : { hasPermission : boolean }
Service-->>Hook : boolean
Hook-->>UI : hasPermission, loading, error
```

**Diagrama fonte**
- [usePermission.ts](file://frontend/hooks/usePermission.ts#L12-L56)
- [permissionService.ts](file://frontend/services/permissionService.ts#L107-L115)

**Seção fonte**
- [usePermission.ts](file://frontend/hooks/usePermission.ts#L1-L142)
- [permissionService.ts](file://frontend/services/permissionService.ts#L1-L135)

## Análise Detalhada dos Componentes

### Componente ClientEditModal
O componente de edição de cliente demonstra validações complexas e tratamento de dados:

```mermaid
flowchart TD
Start([Início]) --> LoadData["Carregar dados do cliente"]
LoadData --> ValidateForm["Validar campos obrigatórios"]
ValidateForm --> PhoneError{"Telefone válido?"}
PhoneError --> |Não| ShowPhoneError["Mostrar erro de telefone"]
PhoneError --> |Sim| DocError{"Documento válido?"}
DocError --> |Não| ShowDocError["Mostrar erro de documento"]
DocError --> |Sim| Save["Enviar para API"]
ShowPhoneError --> End([Fim])
ShowDocError --> End
Save --> Success["Atualizado com sucesso"]
Success --> End
```

**Diagrama fonte**
- [ClientEditModal.tsx](file://frontend/components/ClientEditModal.tsx#L352-L402)

**Seção fonte**
- [ClientEditModal.tsx](file://frontend/components/ClientEditModal.tsx#L1-L711)

### Componente ClientModal
O componente de criação de cliente possui fluxo semelhante com validações adicionais:

```mermaid
flowchart TD
Start([Início]) --> MaskInputs["Aplicar máscaras"]
MaskInputs --> ValidateRequired["Validar campos obrigatórios"]
ValidateRequired --> PhoneError{"Telefone válido?"}
PhoneError --> |Não| ShowPhoneError["Mostrar erro de telefone"]
PhoneError --> |Sim| DocError{"Documento válido?"}
DocError --> |Não| ShowDocError["Mostrar erro de documento"]
DocError --> |Sim| EmailError{"Email válido?"}
EmailError --> |Não| ShowEmailError["Mostrar erro de email"]
EmailError --> |Sim| Save["Enviar para API"]
ShowPhoneError --> End([Fim])
ShowDocError --> End
ShowEmailError --> End
Save --> Success["Criado com sucesso"]
Success --> End
```

**Diagrama fonte**
- [ClientModal.tsx](file://frontend/components/ClientModal.tsx#L317-L366)

**Seção fonte**
- [ClientModal.tsx](file://frontend/components/ClientModal.tsx#L1-L673)

### Hooks de Permissões
Os hooks implementam padrões de acesso a dados com cache local:

```mermaid
sequenceDiagram
participant Component as "Componente"
participant Hook as "useMultiplePermissions"
participant Service as "PermissionService"
participant API as "API"
Component->>Hook : useMultiplePermissions(permissoes)
Hook->>Hook : checkAllPermissions()
loop Para cada permissão
Hook->>Service : checkPermission(resource, action)
Service->>API : GET /check/{resource}/{action}
API-->>Service : { hasPermission }
Service-->>Hook : boolean
end
Hook->>Hook : Set results cache
Hook-->>Component : results, loading, error
```

**Diagrama fonte**
- [usePermission.ts](file://frontend/hooks/usePermission.ts#L58-L120)
- [permissionService.ts](file://frontend/services/permissionService.ts#L107-L115)

**Seção fonte**
- [usePermission.ts](file://frontend/hooks/usePermission.ts#L1-L142)
- [permissionService.ts](file://frontend/services/permissionService.ts#L1-L135)

### Serviços de Dados
Os serviços implementam padrões de acesso a dados com tratamento de erros:

```mermaid
classDiagram
class PermissionService {
+getAvailablePermissions() AvailablePermission[]
+getUsersWithPermissions() UserWithPermissions[]
+getUserPermissions(userId) UserPermission[]
+updateUserPermissions(userId, permissions) void
+checkPermission(resource, action) boolean
+getPermissionAudit(userId, startDate, endDate) PermissionAudit[]
}
class OrdemServicoService {
+getAll(filters) OrdemServico[]
+getStats() Stats
+getNotificationConfigs() NotificationConfig[]
+createNotificationConfig(data) NotificationConfig
}
PermissionService --> AvailablePermission : "retorna"
PermissionService --> UserWithPermissions : "retorna"
PermissionService --> UserPermission : "retorna"
PermissionService --> PermissionAudit : "retorna"
OrdemServicoService --> OrdemServico : "retorna"
```

**Diagrama fonte**
- [permissionService.ts](file://frontend/services/permissionService.ts#L52-L135)
- [ordem_servico.service.ts](file://frontend/services/ordem_servico.service.ts#L3-L19)

**Seção fonte**
- [permissionService.ts](file://frontend/services/permissionService.ts#L1-L135)
- [ordem_servico.service.ts](file://frontend/services/ordem_servico.service.ts#L1-L20)

## Análise de Dependências
As dependências entre componentes seguem um padrão de baixo acoplamento:

```mermaid
graph LR
OS_TYPES["Tipagens OS<br/>ordem-servico.types.ts"] --> CLIENT_EDIT["ClientEditModal.tsx"]
OS_TYPES --> CLIENT_NEW["ClientModal.tsx"]
OS_TYPES --> ORDENS_SERVICE["ordem_servico.service.ts"]
PERM_TYPES["Tipagens Permissões<br/>permission.types.ts"] --> PERMISSION_SERVICE["permissionService.ts"]
PERM_TYPES --> USE_PERMISSION["usePermission.ts"]
PERMISSION_SERVICE --> API["API Backend"]
USE_PERMISSION --> API
CLIENT_EDIT --> API
CLIENT_NEW --> API
```

**Diagrama fonte**
- [ordem-servico.types.ts](file://frontend/types/ordem-servico.types.ts#L1-L235)
- [permission.types.ts](file://frontend/types/permission.types.ts#L1-L55)
- [ClientEditModal.tsx](file://frontend/components/ClientEditModal.tsx#L1-L711)
- [ClientModal.tsx](file://frontend/components/ClientModal.tsx#L1-L673)
- [ordem_servico.service.ts](file://frontend/services/ordem_servico.service.ts#L1-L20)
- [permissionService.ts](file://frontend/services/permissionService.ts#L1-L135)
- [usePermission.ts](file://frontend/hooks/usePermission.ts#L1-L142)

**Seção fonte**
- [ordem-servico.types.ts](file://frontend/types/ordem-servico.types.ts#L1-L235)
- [permission.types.ts](file://frontend/types/permission.types.ts#L1-L55)

## Considerações de Desempenho
- **Cache Local**: Os hooks implementam cache local de resultados de permissões para evitar chamadas redundantes à API.
- **Validações Client-Side**: Componentes realizam validações imediatas antes de enviar dados para o backend, reduzindo chamadas desnecessárias.
- **Tipagem Estática**: As tipagens fortes permitem otimizações durante a compilação e melhor desempenho em tempo de execução.

## Guia de Solução de Problemas
- **Erros de Permissão**: Verificar se o usuário possui as permissões necessárias através do hook `usePermission`.
- **Validações de Dados**: Em componentes de formulário, verificar mensagens de erro retornadas pelas funções de validação.
- **Chamadas API**: Verificar status de resposta e tratar erros específicos de diferentes códigos HTTP.

**Seção fonte**
- [usePermission.ts](file://frontend/hooks/usePermission.ts#L17-L35)
- [ClientEditModal.tsx](file://frontend/components/ClientEditModal.tsx#L355-L381)
- [ClientModal.tsx](file://frontend/components/ClientModal.tsx#L318-L343)

## Conclusão
As tipagens TypeScript implementadas no frontend garantem:
- Segurança de dados através de tipagem forte
- Clareza na definição de entidades e relacionamentos
- Validação eficiente de dados antes do envio para o backend
- Controle de acesso baseado em permissões
- Boas práticas de desenvolvimento com cache local e tratamento de erros

A arquitetura modular e as tipagens bem definidas facilitam a manutenção e evolução do módulo de Ordens de Serviço.