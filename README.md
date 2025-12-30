# Módulo: Ordem de Serviços (@modules/moduloOs)

Este é um módulo personalizado do Sistema Multitenant. Ele fornece funcionalidades integradas com dashboard, listagem e configurações.

## Estrutura do Pacote

Este módulo segue a arquitetura de **Monorepo Híbrido**, onde o código é mantido isolado em um pacote NPM privado, mas consome e injeta componentes na aplicação principal.

```text
packages/modules/moduloOs/
├── package.json          # Definição do pacote NPM (@modules/moduloOs)
├── tsconfig.json         # Configuração de TypeScript (com alias para @/frontend)
├── index.ts              # Ponto de entrada principal (Exports)
├── module.json           # Metadados do módulo
├── module.ts             # Manifesto de integração com o Core
├── frontend/             # Código executado no Browser (Next.js)
│   ├── index.tsx         # Definição do módulo (FrontendModuleDefinition)
│   ├── components/       # Componentes React (Widgets, Pages)
│   │   ├── moduloOsWidget.tsx
│   │   └── moduloOsDashboard.tsx
│   ├── pages/            # Páginas lazy-loaded
│   │   ├── dashboard/    # Página de Dashboard
│   │   ├── lista/        # Página de Lista
│   │   └── configuracoes/# Página de Configurações
│   ├── services/         # Serviços para chamadas API
│   ├── routes.tsx        # Definição de rotas do módulo
│   └── menu.ts           # Estrutura do menu lateral
└── backend/              # Código executado no Servidor (NestJS)
    ├── module.ts         # Definição do módulo Backend (NestJS Module)
    ├── controller.ts     # Controller principal
    ├── cron.service.ts   # Serviço de agendamento de tarefas
    ├── controllers/      # Controllers adicionais
    ├── services/         # Serviços de negócio
    ├── dto/              # Data Transfer Objects
    ├── migrations/       # Migrations SQL
    ├── seeds/            # Dados iniciais
    ├── permissions.ts    # Definição de permissões
    ├── routes.ts         # Registro de rotas
    └── module.config.json# Configurações do módulo
```

## Como Funciona a Integração

### 1. Registro no Frontend
O arquivo `frontend/index.tsx` exporta uma constante `moduloOsModule` que segue a interface `FrontendModuleDefinition`.

```typescript
export const moduloOsModule: FrontendModuleDefinition = {
    id: 'moduloOs',
    widgets: [ ... ]
};
```

Esta definição é importada e registrada no `ModuleLoader.tsx` da aplicação principal.

### 2. Widgets Dinâmicos
O `moduloOsWidget` é um componente React que é renderizado dentro do Dashboard, permitindo:
- Interatividade total (botões, formulários)
- Hooks (useState, useEffect)
- Estilização customizada (Tailwind)

### 3. Páginas

#### Dashboard (`/modules/moduloOs/dashboard`)
Visão geral com métricas e estatísticas do módulo, incluindo:
- Cards de métricas (Total de itens, Crescimento, Usuários ativos)
- Atividades recentes
- Estatísticas detalhadas

#### Lista (`/modules/moduloOs/lista`)
Página de listagem com:
- Tabela de dados
- Busca e filtros
- Ações de CRUD (Visualizar, Editar, Excluir)
- Paginação

#### Configurações (`/modules/moduloOs/configuracoes`)
Página de configurações com:
- Agendamento de notificações automáticas
- Configuração de cron jobs
- Gestão de público-alvo
- Frequências customizáveis (diária, semanal, mensal, intervalo)

## Estrutura de Banco de Dados

O módulo cria as seguintes tabelas:

### mod_moduloOs_configs
Armazena configurações do módulo por tenant.

```sql
CREATE TABLE mod_moduloOs_configs (
    id UUID PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    key VARCHAR(255) NOT NULL,
    value TEXT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

### mod_moduloOs_notification_schedules
Gerencia agendamentos de notificações automáticas.

```sql
CREATE TABLE mod_moduloOs_notification_schedules (
    id UUID PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    audience VARCHAR(50) DEFAULT 'all',
    cron_expression VARCHAR(100) NOT NULL,
    enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

## Permissões

O módulo define as seguintes permissões:

- `moduloOs.view` - Visualizar o módulo
- `moduloOs.create` - Criar configurações
- `moduloOs.edit` - Editar configurações
- `moduloOs.delete` - Excluir configurações
- `moduloOs.admin` - Administrar o módulo

## Como Estender este Módulo

### Adicionar um Novo Widget
1. Crie o componente em `frontend/components/MeuWidget.tsx`
2. Importe-o em `frontend/index.tsx`
3. Adicione ao array `widgets` na definição `moduloOsModule`

### Adicionar uma Nova Página
1. Crie a página em `frontend/pages/novapagina/page.tsx`
2. Adicione a rota em `frontend/routes.tsx`
3. Adicione item no menu em `frontend/menu.ts`

### Adicionar uma Nova API
1. Crie o controller em `backend/controllers/meu.controller.ts`
2. Adicione o serviço em `backend/services/meu.service.ts`
3. Registre o controller em `backend/routes.ts`

## Comandos Úteis

Como este é um pacote do workspace, você deve rodar os comandos da raiz do monorepo:

- **Instalar dependências:** `npm install`
- **Adicionar lib ao módulo:** `npm install <lib> -w @modules/moduloOs`

## Integração com Cron

O módulo utiliza o sistema de Cron do Core para agendar tarefas automáticas. O serviço `moduloOsCronService` gerencia:

- Registro dinâmico de jobs baseados em configurações do banco
- Execução de notificações automáticas
- Limpeza de jobs órfãos

## API Endpoints

### Backend Endpoints

- `GET /api/moduloOs` - Lista todos os itens (com filtros)
- `GET /api/moduloOs/stats` - Retorna estatísticas do módulo
- `GET /modules/moduloOs/config/notifications` - Lista agendamentos
- `POST /modules/moduloOs/config/notifications` - Cria novo agendamento

### Frontend Routes

- `/modules/moduloOs/dashboard` - Dashboard principal
- `/modules/moduloOs/lista` - Lista de itens
- `/modules/moduloOs/configuracoes` - Configurações e agendamentos

## Personalização

Para personalizar este módulo para suas necessidades:

1. Modifique as páginas em `frontend/pages/`
2. Ajuste os serviços em `backend/services/`
3. Adicione novas migrations em `backend/migrations/`
4. Atualize as permissões em `backend/permissions.ts`

---
*GOR Informática - Arquitetura Modular v2.0*
