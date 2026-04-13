# Controle de Acesso e Permissoes

Data: 2026-04-13
Modulo: `ordem_servico`

Este documento registra onde o modulo `ordem_servico` bloqueia acesso e como o mesmo padrao pode ser reaplicado em outros modulos.

## Objetivo

O controle de acesso do modulo acontece em tres camadas:

1. menu e entrada da pagina no frontend
2. guard de pagina e componentes no frontend
3. validacao real dos endpoints no backend

O usuario `SUPER_ADMIN` e `ADMIN` passam automaticamente no frontend e no backend.

## 1. Frontend

### 1.1 Guard de pagina

As paginas do modulo usam `ModulePageGuard` com o recurso e a acao correspondentes.

Exemplos:

- `frontend/pages/dashboard/page.tsx` usa `resource="dashboard"` e `action="view"`
- `frontend/pages/clientes/page.tsx` usa `resource="clients"` e `action="view"`
- `frontend/pages/ordens/page.tsx` usa `resource="orders"` e `action="view"`
- `frontend/pages/produtos/page.tsx` usa `resource="products"` e `action="view"`
- `frontend/pages/configuracoes/page.tsx` usa `resource="config"` e `action="view"`

Arquivos envolvidos:

- `frontend/components/ModulePageGuard.tsx`
- `frontend/components/ModuleAccessGuard.tsx`

### 1.2 Hook de permissao

O hook central do modulo fica em:

- `frontend/hooks/usePermission.ts`

Fluxo:

1. Se nao houver usuario autenticado, retorna acesso negado.
2. Se o usuario for `SUPER_ADMIN` ou `ADMIN`, retorna acesso liberado sem consultar API.
3. Para os demais, consulta `GET /api/ordem_servico/permissions/check/:resource/:action`.

O mesmo comportamento foi alinhado tambem para:

- `frontend/components/PermissionGuard.tsx`

Esse componente e usado quando o bloqueio precisa acontecer em blocos internos da tela, nao apenas na pagina inteira.

### 1.3 Service de permissao do frontend

Arquivo:

- `frontend/services/permissionService.ts`

Endpoint principal de consulta:

- `GET /api/ordem_servico/permissions/check/:resource/:action`

### 1.4 Menu do modulo

Arquivo:

- `frontend/module-manifest.ts`

O manifesto registra os itens do modulo e suas chaves de permissao para integracao com o host. O bloqueio real, porem, continua sendo feito pelos guards de pagina e pelos endpoints do backend.

## 2. Backend

### 2.1 Guard real dos endpoints

O guard central fica em:

- `backend/shared/guards/permission.guard.ts`

Fluxo:

1. Le o metadata `permission` definido no handler.
2. Recupera o usuario autenticado do request.
3. Chama `PermissionService.hasPermission(user.id, resource, action, user.role)`.
4. Se nao houver permissao, retorna `ForbiddenException`.

### 2.2 Decorators

Arquivos:

- `backend/shared/decorators/permissions.decorator.ts`
- `backend/shared/decorators/require-permission.decorator.ts`

Uso:

- `@Permissions(...)` no nivel de classe para explicitar o dominio protegido
- `@RequirePermission(...)` ou decorators especificos no nivel do endpoint

Exemplos de decorators especificos:

- `RequireDashboardPermission`
- `RequireOrdersPermission`
- `RequireClientsPermission`
- `RequireProductsPermission`
- `RequireConfigPermission`

### 2.3 Service central de permissao

Arquivo:

- `backend/shared/services/permission.service.ts`

Regras principais:

1. `SUPER_ADMIN` e `ADMIN` recebem acesso total imediatamente.
2. Se o modulo estiver desabilitado no tenant, o acesso e negado para os demais perfis.
3. O sistema procura permissao explicita em `mod_ordem_servico_user_permissions`.
4. Se nao existir permissao explicita, aplica a matriz por perfil em `mod_ordem_servico_profile_permissions`.
5. O fallback de perfis usa `admin`, `technician` e `attendant`.

### 2.4 Escopo por tenant

O servico de permissao foi alinhado para respeitar o tenant atual em pontos sensiveis:

- listagem de usuarios com permissao
- busca do usuario alvo para leitura e alteracao de permissoes

Isso evita consultar ou alterar permissoes de usuarios fora do tenant corrente.

## 3. Onde o modulo bloqueia hoje

### 3.1 Dashboard

- Frontend: `frontend/pages/dashboard/page.tsx`
- Backend: endpoints protegidos por `RequireOrdersPermission('view')` e correlatos

### 3.2 Clientes

- Frontend: `frontend/pages/clientes/page.tsx`
- Backend: recurso `clients`

### 3.3 Ordens

- Frontend: `frontend/pages/ordens/page.tsx`, `frontend/pages/ordens/new/page.tsx`, `frontend/pages/ordens/edit/page.tsx`, `frontend/pages/ordens/print/page.tsx`
- Backend: `backend/ordens/ordens.controller.ts`

### 3.4 Produtos

- Frontend: `frontend/pages/produtos/page.tsx`
- Backend: `backend/produtos/produtos.controller.ts`

### 3.5 Configuracoes

- Frontend: `frontend/pages/configuracoes/page.tsx`
- Backend: `backend/configuracoes/configuracoes.controller.ts`

## 4. Como reaplicar em outro modulo

Para repetir o mesmo padrao em outro modulo:

1. Criar `ModuleAccessGuard`, `ModulePageGuard` e `usePermission`.
2. Garantir bypass de `SUPER_ADMIN` e `ADMIN` no frontend.
3. Expor um endpoint `GET /permissions/check/:resource/:action`.
4. Criar `PermissionGuard` no backend.
5. Criar decorators `@Permissions(...)` e `@RequirePermission(...)`.
6. Aplicar `JwtAuthGuard` + `PermissionGuard` nos controllers do modulo.
7. Fazer o service de permissao respeitar o tenant atual.
8. Garantir que paginas sensiveis usem `ModulePageGuard`.

## 5. Arquivos de referencia

Frontend:

- `frontend/hooks/usePermission.ts`
- `frontend/components/ModuleAccessGuard.tsx`
- `frontend/components/ModulePageGuard.tsx`
- `frontend/components/PermissionGuard.tsx`
- `frontend/services/permissionService.ts`

Backend:

- `backend/shared/guards/permission.guard.ts`
- `backend/shared/decorators/permissions.decorator.ts`
- `backend/shared/decorators/require-permission.decorator.ts`
- `backend/shared/services/permission.service.ts`
- `backend/shared/controllers/permission.controller.ts`

Controllers de uso real:

- `backend/ordens/ordens.controller.ts`
- `backend/configuracoes/configuracoes.controller.ts`
- `backend/produtos/produtos.controller.ts`
