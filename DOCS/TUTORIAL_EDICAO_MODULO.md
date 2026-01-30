# 📘 Tutorial de Edição do Módulo - Criar Novo Módulo

Este tutorial lista **TODOS** os arquivos, nomes, pastas e códigos que precisam ser alterados para transformar o módulo `ordem_servico` em um novo módulo com nome diferente.

---

## 📋 Índice
1. [Decisões Iniciais](#1-decisões-iniciais)
2. [Estrutura de Pastas](#2-estrutura-de-pastas)
3. [Arquivos de Configuração](#3-arquivos-de-configuração)
4. [Backend - Arquivos TypeScript](#4-backend---arquivos-typescript)
5. [Frontend - Arquivos TypeScript/React](#5-frontend---arquivos-typescriptreact)
6. [Banco de Dados](#6-banco-de-dados)
7. [Checklist Final](#7-checklist-final)

---

## 1. Decisões Iniciais

Antes de começar, defina os seguintes valores para o seu novo módulo:

| Item | Exemplo Atual | Novo Valor |
|------|---------------|------------|
| **Nome Técnico** (snake_case) | `ordem_servico` | `seu_modulo` |
| **Nome Display** | `Ordem de Serviço` | `Seu Módulo` |
| **Nome Display Plural** | `Ordem de Serviços` | `Seus Módulos` |
| **Ícone Principal** | `Wrench` | `SeuIcone` |
| **Prefixo de Tabelas** | `mod_ordem_servico_` | `mod_seu_modulo_` |
| **Nome PascalCase** | `OrdemServico` | `SeuModulo` |
| **Nome camelCase** | `ordemServico` | `seuModulo` |
| **Slug de Rota** | `/ordem_servico` | `/seu_modulo` |

---

## 2. Estrutura de Pastas

### 2.1 Nome da Pasta Principal
**Localização:** Raiz do projeto
- **Atual:** `module-os/`
- **Alterar para:** `module-seu-modulo/`

> **Importante:** Renomeie a pasta raiz do módulo antes de começar as alterações internas.

---

## 3. Arquivos de Configuração

### 3.1 `/module.json` (Raiz)
**Função:** Configuração principal do módulo, define metadados, menus e configurações padrão.

**O que alterar:**
```json
{
  "name": "seu_modulo",                    // Nome técnico
  "displayName": "Seu Módulo",             // Nome exibido
  "version": "1.0.0",                      // Mantenha ou atualize
  "description": "Módulo de ...",          // Nova descrição
  "author": "Seu Nome/Empresa",            // Seu autor
  "icon": "SeuIcone",                      // Ícone principal (Lucide React)
  "menus": [
    {
      "label": "Dashboard",                // Label do menu
      "route": "/modules/seu_modulo/pages/dashboard",  // Rota
      "icon": "BarChart3",                 // Ícone do submenu
      "order": 1
    },
    {
      "label": "Seus Itens",               // Personalize os itens do menu
      "route": "/modules/seu_modulo/pages/itens",
      "icon": "ClipboardList",
      "order": 2
    }
    // Adicione/remova itens conforme necessário
  ]
}
```

**Ícones disponíveis:** Consulte [Lucide Icons](https://lucide.dev/icons/)

---

### 3.2 `/backend/module.json`
**Função:** Duplicata da configuração principal para o backend.

**O que alterar:**
- Mesmo conteúdo do `/module.json` da raiz
- Mantenha sincronizado

---

### 3.3 `/backend/module.config.json`
**Função:** Configuração estendida com rotas, permissões e integrações.

**O que alterar:**
```json
{
  "name": "seu_modulo",
  "slug": "seu_modulo",
  "displayName": "Seus Módulos",
  "version": "1.0.1",
  "description": "Módulo personalizado...",
  "author": "Seu Nome",
  "config": {
    "permissions": [
      "seu_modulo.view",
      "seu_modulo.create",
      "seu_modulo.edit",
      "seu_modulo.delete",
      "seu_modulo.admin"
    ],
    "routes": [
      {
        "path": "/seu_modulo",
        "component": "seuModuloDashboardPage",
        "title": "Dashboard Seus Módulos",
        "protected": true,
        "permissions": ["seu_modulo.view"]
      }
      // Atualize todas as rotas
    ],
    "menuItems": [
      {
        "id": "seu_modulo-main",
        "label": "Seus Módulos",
        "icon": "SeuIcone",
        "path": "/seu_modulo",
        "order": 10,
        "permissions": ["seu_modulo.view"]
      }
    ],
    "database": {
      "tables": ["seu_modulo_configs"],
      "migrations": true
    }
  }
}
```

---

### 3.4 `/README.md` (Raiz)
**Função:** Documentação principal do módulo.

**O que alterar:**
```markdown
# Módulo: Seus Módulos

Este é um módulo personalizado do Sistema Multitenant para...

## Banco de Dados

- `mod_seu_modulo_configs` - Configurações do módulo
- `mod_seu_modulo_items` - Seus itens principais
...

## Permissões

- `seu_modulo.view` - Visualizar o módulo
- `seu_modulo.create` - Criar registros
...

## Rotas do Frontend

- `/modules/seu_modulo/pages/dashboard` - Dashboard principal
...
```

---

### 3.5 `/backend/README.md`
**Função:** Documentação do backend.

**O que alterar:**
- Mesmo conteúdo do README raiz, adaptado para backend

---

## 4. Backend - Arquivos TypeScript

### 4.1 `/backend/ordem_servico.module.ts`
**Função:** Módulo principal do NestJS que importa e exporta todos os submódulos.

**O que alterar:**
1. **Nome do arquivo:** Renomear para `seu_modulo.module.ts`
2. **Conteúdo:**

```typescript
import { Module } from '@nestjs/common';
// Atualize os imports com os nomes dos seus submódulos
import { ClientesModule } from './clientes/clientes.module';
import { ProdutosModule } from './produtos/produtos.module';
// ...

@Module({
    imports: [
        PrismaModule,
        AuditModule,
        SharedModule,
        CoreModule,
        ClientesModule,  // Seus submódulos
        ProdutosModule,
        // ...
    ],
    exports: [
        ClientesModule,
        ProdutosModule,
        // ...
    ],
})
export class SeuModuloModule {  // Altere o nome da classe
    constructor() {
        console.log('✅ MÓDULO SEU_MODULO CARREGADO!!!');
    }
}
```

---

### 4.2 `/backend/routes.ts`
**Função:** Define os controllers que serão expostos como rotas da API.

**O que alterar:**
```typescript
import { ClientesController } from './clientes/clientes.controller';
import { ProdutosController } from './produtos/produtos.controller';
// Atualize os imports conforme seus controllers

export const ModuleRoutes = [
    ClientesController,
    ProdutosController,
    // Liste todos os controllers do seu módulo
];
```

---

### 4.3 Submódulos do Backend

Para cada pasta de funcionalidade (`clientes/`, `produtos/`, `ordens/`, `configuracoes/`, etc.):

#### 4.3.1 Controllers (`*.controller.ts`)
**Função:** Expõe endpoints REST da API.

**O que alterar:**
```typescript
import { Controller, Get, Post, Put, Delete } from '@nestjs/common';
import { JwtAuthGuard } from '@core/common/guards/jwt-auth.guard';
import { RequirePermission } from '../shared/decorators/require-permission.decorator';

@Controller('api/seu_modulo/clientes')  // Atualize o prefixo da rota
@UseGuards(JwtAuthGuard, PermissionGuard)
export class ClientesController {
    
    @Get()
    @RequirePermission('seu_modulo.client.view')  // Atualize as permissões
    async findAll() {
        // ...
    }
    
    @Post()
    @RequirePermission('seu_modulo.client.create')
    async create(@Body() data: any) {
        // ...
    }
}
```

**Arquivos a alterar:**
- `/backend/clientes/clientes.controller.ts`
- `/backend/produtos/produtos.controller.ts`
- `/backend/ordens/ordens.controller.ts`
- `/backend/configuracoes/configuracoes.controller.ts`
- `/backend/configuracoes/tipos-equipamento.controller.ts`
- `/backend/configuracoes/tipos-servico.controller.ts`
- `/backend/core/ordem-servico-config.controller.ts` → `seu-modulo-config.controller.ts`
- `/backend/shared/controllers/permission.controller.ts`
- `/backend/shared/controllers/template.controller.ts`
- `/backend/shared/controllers/ai.controller.ts`

---

#### 4.3.2 Services (`*.service.ts`)
**Função:** Contém a lógica de negócio.

**O que alterar:**
```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@core/prisma/prisma.service';

@Injectable()
export class ClientesService {
    constructor(private prisma: PrismaService) {}
    
    async findAll(tenantId: string) {
        return this.prisma.mod_seu_modulo_clients.findMany({
            // Atualize os nomes das tabelas
            where: { tenant_id: tenantId }
        });
    }
}
```

**Arquivos a alterar:**
- `/backend/clientes/clientes.service.ts`
- `/backend/produtos/produtos.service.ts`
- `/backend/ordens/ordens.service.ts`
- `/backend/configuracoes/configuracoes.service.ts`
- `/backend/configuracoes/tipos-equipamento.service.ts`
- `/backend/configuracoes/tipos-servico.service.ts`
- `/backend/core/ordem-servico-cron.service.ts` → `seu-modulo-cron.service.ts`
- `/backend/shared/services/permission.service.ts`
- `/backend/shared/services/template.service.ts`
- `/backend/shared/services/ai.service.ts`

---

#### 4.3.3 Modules (`*.module.ts`)
**Função:** Define os módulos NestJS que agrupam controllers, services e suas dependências.

**Arquivos a alterar:**
- `/backend/clientes/clientes.module.ts`
- `/backend/produtos/produtos.module.ts`
- `/backend/ordens/ordens.module.ts`
- `/backend/configuracoes/configuracoes.module.ts`
- `/backend/core/core.module.ts`
- `/backend/shared/shared.module.ts`

---

### 4.4 Constantes e DTOs

#### 4.4.1 `/backend/shared/constants/available-permissions.ts`
**Função:** Define todas as permissões disponíveis no módulo.

**O que alterar:**
```typescript
export const AVAILABLE_PERMISSIONS = [
  {
    resource: 'client',
    name: 'Clientes',
    description: 'Gerenciamento de clientes',
    actions: [
      {
        action: 'view',
        name: 'Ver Clientes',
        description: 'Permite visualizar clientes',
        permission: 'seu_modulo.client.view'  // Atualize o prefixo
      },
      {
        action: 'create',
        name: 'Criar Clientes',
        description: 'Permite criar novos clientes',
        permission: 'seu_modulo.client.create'
      }
      // ... todas as permissões
    ]
  }
  // Repita para todos os recursos
];
```

---

#### 4.4.2 `/backend/shared/dto/ordem-servico.dto.ts`
**Função:** Define os Data Transfer Objects.

**O que alterar:**
1. **Nome do arquivo:** Renomear para `seu-modulo.dto.ts`
2. Atualizar nomes de classes e interfaces

---

### 4.5 Utilitários

#### `/backend/ordens/pdf-template.util.ts`
**Função:** Template para geração de PDFs.

**O que alterar:**
- Textos, títulos e labels específicos do domínio
- Campos personalizados conforme seu módulo

---

## 5. Frontend - Arquivos TypeScript/React

### 5.1 `/frontend/index.tsx`
**Função:** Entry point do frontend, define widgets e exporta páginas.

**O que alterar:**
```typescript
import React from 'react';
import { FrontendModuleDefinition } from '@/lib/module-types';
import { SeuModuloWidget } from './components/SeuModuloWidget';
export { default as seuModuloConfiguracoesPage } from './pages/configuracoes';

export const seuModuloModule: FrontendModuleDefinition = {
    id: 'seuModulo',              // camelCase
    name: 'Seus Módulos',         // Display name
    
    widgets: [
        {
            id: 'seuModulo-status',
            type: 'summary_card',
            title: 'Status Seus Módulos',
            component: SeuModuloWidget,
            gridSize: { w: 1, h: 1 },
            order: 1,
            icon: 'Box'
        }
    ]
};
```

---

### 5.2 `/frontend/menu.ts`
**Função:** Define a estrutura de menu do módulo.

**O que alterar:**
```typescript
export const ModuleMenu = [
    {
        id: 'seu_modulo-main',
        name: 'Seu Módulo',
        icon: 'SeuIcone',
        href: '/seu_modulo/dashboard',
        order: 10,
        group: 'seu_modulo',
        roles: ['ADMIN', 'SUPER_ADMIN'],
        
        children: [
            {
                id: 'seu_modulo-dashboard',
                name: 'Dashboard',
                href: '/seu_modulo/dashboard',
                icon: 'BarChart3',
                order: 1
            },
            {
                id: 'seu_modulo-itens',
                name: 'Seus Itens',
                href: '/seu_modulo/itens',
                icon: 'ClipboardList',
                order: 2
            }
            // Personalize os itens do menu
        ]
    }
];
```

---

### 5.3 `/frontend/routes.tsx`
**Função:** Define as rotas do frontend e mapeia para componentes.

**O que alterar:**
```typescript
import seuModuloDashboardPage from './pages/dashboard';
import seuModuloListaPage from './pages/lista';
import seuModuloConfiguracoesPage from './pages/configuracoes';
// Atualize todos os imports

const MODULE_ROOT = '/seu_modulo';

export const ModuleRoutes = [
    { path: `${MODULE_ROOT}/dashboard`, component: seuModuloDashboardPage },
    { path: `${MODULE_ROOT}/lista`, component: seuModuloListaPage },
    { path: `${MODULE_ROOT}/configuracoes`, component: seuModuloConfiguracoesPage },
    // Atualize todas as rotas
];
```

---

### 5.4 Services do Frontend

#### `/frontend/services/ordem_servico.service.ts`
**Função:** Serviço para chamadas à API.

**O que alterar:**
1. **Nome do arquivo:** Renomear para `seu_modulo.service.ts`
2. **Conteúdo:**

```typescript
import api from '@/lib/api';

export const seuModuloService = {
    getAll: async (filters?: any) => {
        return api.get('/api/seu_modulo', { params: filters });
    },
    
    getStats: async () => {
        return api.get('/api/seu_modulo/stats');
    },
    
    // Atualize todas as chamadas de API
};
```

**Arquivos a alterar:**
- `/frontend/services/ordem_servico.service.ts` → `seu_modulo.service.ts`
- `/frontend/services/permissionService.ts` (atualizar referências)
- `/frontend/services/templateService.ts` (atualizar referências)

---

### 5.5 Tipos TypeScript

#### `/frontend/types/ordem-servico.types.ts`
**Função:** Define interfaces e tipos TypeScript.

**O que alterar:**
1. **Nome do arquivo:** Renomear para `seu-modulo.types.ts`
2. Atualizar nomes de interfaces e tipos

**Arquivos a alterar:**
- `/frontend/types/ordem-servico.types.ts` → `seu-modulo.types.ts`
- `/frontend/types/permission.types.ts` (atualizar referências)

---

### 5.6 Hooks Personalizados

#### `/frontend/hooks/usePermission.ts`
**Função:** Hook para verificar permissões.

**O que alterar:**
```typescript
import { useCallback } from 'react';

export const usePermission = () => {
    const hasPermission = useCallback((permission: string) => {
        // Exemplo: 'seu_modulo.client.view'
        // Lógica de verificação
    }, []);
    
    return { hasPermission };
};
```

**Arquivos a alterar:**
- `/frontend/hooks/usePermission.ts`
- `/frontend/hooks/useAI.ts` (se utilizar)

---

### 5.7 Componentes React

Todos os componentes em `/frontend/components/` devem ser revisados e atualizados.

**Lista de componentes a alterar:**

| Arquivo | Função | O que alterar |
|---------|--------|---------------|
| `ClientEditModal.tsx` | Modal de edição de clientes | Textos, chamadas de API, tipos |
| `ClientModal.tsx` | Modal de criação de clientes | Textos, chamadas de API, tipos |
| `ClientOrdersList.tsx` | Lista de ordens por cliente | Textos, chamadas de API |
| `MeuModuloDashboard.tsx` | Dashboard principal | Widgets, métricas, textos |
| `MeuModuloWidget.tsx` | Widget resumo | Dados exibidos, estilos |
| `OrdemViewModal.tsx` | Modal de visualização | Campos, layout |
| `PermissionDenied.tsx` | Página de acesso negado | Textos, ícones |
| `PermissionGuard.tsx` | Guard de permissão | Lógica de verificação |
| `PermissionManagement.tsx` | Gerenciamento de permissões | Lista de permissões |
| `PermissionMatrix.tsx` | Matriz de permissões | Permissões do módulo |
| `PrintModal.tsx` | Modal de impressão | Templates, campos |
| `PrintTemplateA4.tsx` | Template impressão A4 | Layout, campos |
| `PrintTemplateThermal.tsx` | Template impressão térmica | Layout, campos |
| `ProfilePermissionMatrix.tsx` | Matriz por perfil | Permissões do módulo |
| `TiposEquipamentoManager.tsx` | Gerenciar tipos de equipamento | CRUD, textos |
| `TiposServicoManager.tsx` | Gerenciar tipos de serviço | CRUD, textos |
| `WhatsAppModal.tsx` | Modal WhatsApp | Mensagens, templates |
| `ui/rich-text-editor.tsx` | Editor de texto rico | - |

**Exemplo de alteração em componente:**
```typescript
// MeuModuloDashboard.tsx → SeuModuloDashboard.tsx

import React from 'react';
import { seuModuloService } from '../services/seu_modulo.service';

export const SeuModuloDashboard = () => {
    const [stats, setStats] = useState(null);
    
    useEffect(() => {
        const loadStats = async () => {
            const response = await seuModuloService.getStats();
            setStats(response.data);
        };
        loadStats();
    }, []);
    
    return (
        <div>
            <h1>Dashboard - Seus Módulos</h1>
            {/* Atualize os widgets e métricas */}
        </div>
    );
};
```

---

### 5.8 Páginas React

Todas as páginas em `/frontend/pages/` devem ser atualizadas.

**Estrutura de pastas a renomear/ajustar:**

```
/frontend/pages/
├── clientes/
│   ├── index.tsx       → Atualizar imports e chamadas de API
│   └── page.tsx        → Atualizar componentes e lógica
├── configuracoes/
│   ├── index.tsx
│   └── page.tsx
├── dashboard/
│   ├── index.tsx
│   └── page.tsx
├── lista/
│   ├── index.tsx
│   └── page.tsx
├── ordens/             → Renomear para o recurso principal do seu módulo
│   ├── edit/
│   │   └── page.tsx
│   ├── new/
│   │   └── page.tsx
│   ├── print/
│   │   └── page.tsx
│   ├── index.tsx
│   └── page.tsx
└── produtos/
    ├── index.tsx
    └── page.tsx
```

**O que alterar em cada página:**
- Imports de services
- Imports de types
- Imports de hooks
- Chamadas de API
- Textos e labels
- Títulos de página
- Breadcrumbs
- Verificações de permissão

**Exemplo:**
```typescript
// /frontend/pages/dashboard/page.tsx

import React from 'react';
import { SeuModuloDashboard } from '../../components/SeuModuloDashboard';
import { usePermission } from '../../hooks/usePermission';

const DashboardPage = () => {
    const { hasPermission } = usePermission();
    
    if (!hasPermission('seu_modulo.view')) {
        return <PermissionDenied />;
    }
    
    return <SeuModuloDashboard />;
};

export default DashboardPage;
```

---

## 6. Banco de Dados

### 6.1 Migrações SQL

**Arquivos a alterar:**

#### `/backend/migrations/001_master.sql`
**Função:** Migration principal que cria todas as tabelas.

**O que alterar:**
```sql
-- Altere todos os nomes de tabelas
CREATE TABLE IF NOT EXISTS mod_seu_modulo_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id TEXT NOT NULL,
    key VARCHAR(255) NOT NULL,
    value TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Atualize todos os índices
CREATE INDEX IF NOT EXISTS idx_seu_modulo_configs_tenant 
ON mod_seu_modulo_configs(tenant_id);

-- Atualize todos os comentários
COMMENT ON TABLE mod_seu_modulo_configs IS 'Configurações do módulo Seu Módulo';

-- Repita para todas as tabelas:
-- - mod_seu_modulo_clients
-- - mod_seu_modulo_products
-- - mod_seu_modulo_orders
-- - mod_seu_modulo_notification_schedules
-- etc.
```

---

#### `/backend/migrations/003_add_print_fields.sql`
**Função:** Adiciona campos de impressão.

**O que alterar:**
- Nomes de tabelas
- Comentários

---

#### `/backend/migrations/004_add_tables_os.sql`
**Função:** Adiciona tabelas específicas de ordens de serviço.

**O que alterar:**
- Nomes de tabelas para refletir seu domínio
- Relacionamentos
- Constraints

---

### 6.2 Seeds (Dados Iniciais)

#### `/backend/seeds/seed.sql`
**Função:** Insere dados iniciais básicos.

**O que alterar:**
```sql
-- Atualize os nomes das tabelas
INSERT INTO mod_seu_modulo_configs (tenant_id, key, value)
VALUES 
    ('default', 'module_name', 'Seu Módulo'),
    ('default', 'module_enabled', 'true');
```

---

#### `/backend/seeds/permissions_seed.sql`
**Função:** Insere permissões iniciais.

**O que alterar:**
```sql
-- Atualize os prefixos das permissões
INSERT INTO permissions (code, name, description, module)
VALUES 
    ('seu_modulo.view', 'Ver Seu Módulo', 'Permite visualizar o módulo', 'seu_modulo'),
    ('seu_modulo.create', 'Criar Registros', 'Permite criar registros', 'seu_modulo'),
    ('seu_modulo.edit', 'Editar Registros', 'Permite editar registros', 'seu_modulo'),
    ('seu_modulo.delete', 'Excluir Registros', 'Permite excluir registros', 'seu_modulo'),
    ('seu_modulo.admin', 'Administrar Módulo', 'Acesso administrativo completo', 'seu_modulo');
```

---

#### `/backend/seeds/seeds_os.sql`
**Função:** Seeds específicos do domínio (tipos de serviço, equipamentos, etc.).

**O que alterar:**
- Nomes de tabelas
- Dados de exemplo conforme seu domínio

---

### 6.3 Atualização de Queries Prisma

Em todos os services, atualize as queries do Prisma:

```typescript
// Antes
this.prisma.mod_ordem_servico_clients.findMany()

// Depois
this.prisma.mod_seu_modulo_clients.findMany()
```

**Tabelas a atualizar:**
- `mod_ordem_servico_configs` → `mod_seu_modulo_configs`
- `mod_ordem_servico_clients` → `mod_seu_modulo_clients`
- `mod_ordem_servico_products` → `mod_seu_modulo_products`
- `mod_ordem_servico_orders` → `mod_seu_modulo_orders`
- `mod_ordem_servico_order_items` → `mod_seu_modulo_order_items`
- `mod_ordem_servico_notification_schedules` → `mod_seu_modulo_notification_schedules`
- `mod_ordem_servico_tipos_servico` → `mod_seu_modulo_tipos_servico`
- `mod_ordem_servico_tipos_equipamento` → `mod_seu_modulo_tipos_equipamento`

---

## 7. Checklist Final

Use este checklist para garantir que todas as alterações foram feitas:

### ✅ Estrutura e Nomenclatura

- [ ] Pasta raiz renomeada (`module-os` → `module-seu-modulo`)
- [ ] Todos os identificadores `ordem_servico` substituídos por `seu_modulo`
- [ ] Todos os identificadores `ordemServico` substituídos por `seuModulo`
- [ ] Todos os identificadores `OrdemServico` substituídos por `SeuModulo`

### ✅ Arquivos de Configuração

- [ ] `/module.json` - name, displayName, description, icon, menus
- [ ] `/backend/module.json` - sincronizado com raiz
- [ ] `/backend/module.config.json` - name, slug, displayName, permissions, routes, menuItems
- [ ] `/README.md` - documentação atualizada
- [ ] `/backend/README.md` - documentação atualizada

### ✅ Backend

- [ ] `/backend/ordem_servico.module.ts` → `seu_modulo.module.ts` (nome arquivo + classe)
- [ ] `/backend/routes.ts` - imports e exports atualizados
- [ ] Todos os controllers - decoradores `@Controller()` com novos paths
- [ ] Todos os controllers - decoradores `@RequirePermission()` com novas permissões
- [ ] Todos os services - queries Prisma com novos nomes de tabelas
- [ ] Todos os modules - imports e exports atualizados
- [ ] `/backend/core/ordem-servico-config.controller.ts` → `seu-modulo-config.controller.ts`
- [ ] `/backend/core/ordem-servico-cron.service.ts` → `seu-modulo-cron.service.ts`
- [ ] `/backend/shared/constants/available-permissions.ts` - todas as permissões
- [ ] `/backend/shared/dto/ordem-servico.dto.ts` → `seu-modulo.dto.ts`

### ✅ Frontend

- [ ] `/frontend/index.tsx` - exports e definição do módulo
- [ ] `/frontend/menu.ts` - ids, names, hrefs, icon
- [ ] `/frontend/routes.tsx` - MODULE_ROOT e todos os paths
- [ ] `/frontend/services/ordem_servico.service.ts` → `seu_modulo.service.ts`
- [ ] Todos os services - endpoints da API atualizados
- [ ] `/frontend/types/ordem-servico.types.ts` → `seu-modulo.types.ts`
- [ ] Todos os hooks - imports e lógica
- [ ] Todos os componentes - imports, types, API calls, textos
- [ ] Todas as páginas - imports, types, API calls, textos, permissões

### ✅ Banco de Dados

- [ ] `/backend/migrations/001_master.sql` - nomes de tabelas, índices, comentários
- [ ] `/backend/migrations/003_add_print_fields.sql` - nomes de tabelas
- [ ] `/backend/migrations/004_add_tables_os.sql` - nomes de tabelas
- [ ] `/backend/seeds/seed.sql` - dados iniciais
- [ ] `/backend/seeds/permissions_seed.sql` - permissões
- [ ] `/backend/seeds/seeds_os.sql` - seeds específicos do domínio

### ✅ Ícones

Lista de ícones mencionados no módulo (Lucide React):

**Ícone Principal:**
- [ ] `Wrench` (padrão) → Escolha um ícone adequado ao seu módulo

**Ícones de Menu:**
- [ ] `BarChart3` (Dashboard)
- [ ] `ClipboardList` (Ordens/Itens)
- [ ] `Users` (Clientes)
- [ ] `Package` (Produtos)
- [ ] `Settings` (Configurações)

**Outros ícones usados no módulo:**
- [ ] `Box` (Widget)
- [ ] Revise e personalize conforme necessário

### ✅ Testes

- [ ] Executar `npm install` no backend e frontend
- [ ] Executar migrações do banco de dados
- [ ] Testar todas as rotas da API
- [ ] Testar todas as páginas do frontend
- [ ] Verificar permissões
- [ ] Testar widgets no dashboard
- [ ] Validar menus e navegação

---

## 📌 Notas Importantes

### Nomenclatura Consistente

Mantenha a consistência em todos os arquivos:

| Contexto | Formato | Exemplo |
|----------|---------|---------|
| URLs e rotas | snake_case | `/seu_modulo/dashboard` |
| Nomes de arquivos | kebab-case | `seu-modulo.service.ts` |
| Classes TypeScript | PascalCase | `SeuModuloService` |
| Variáveis JavaScript | camelCase | `seuModuloData` |
| Tabelas SQL | snake_case com prefixo | `mod_seu_modulo_configs` |
| Permissões | snake_case com pontos | `seu_modulo.view` |

### Prefixos de Tabelas

Todas as tabelas do módulo devem ter o prefixo `mod_seu_modulo_` para:
- Evitar conflitos com outros módulos
- Facilitar identificação e manutenção
- Seguir padrões do sistema

### Ícones Lucide React

Escolha ícones apropriados do [catálogo Lucide](https://lucide.dev/icons/) que representem:
- Funcionalidade principal do módulo
- Cada seção do menu
- Estados e ações nos componentes

### Permissões Granulares

Defina permissões detalhadas seguindo o padrão:
- `seu_modulo.recurso.acao`
- Exemplos: `seu_modulo.client.view`, `seu_modulo.order.create`

---

## 🎯 Próximos Passos

Após completar todas as alterações:

1. **Validação de Sintaxe:**
   ```bash
   cd backend
   npm run build
   
   cd ../frontend
   npm run build
   ```

2. **Executar Migrações:**
   ```bash
   npm run migration:run
   ```

3. **Executar Seeds:**
   ```bash
   npm run seed:run
   ```

4. **Testar Localmente:**
   ```bash
   # Backend
   npm run start:dev
   
   # Frontend
   npm run dev
   ```

5. **Revisão de Código:**
   - Buscar por referências antigas usando busca global
   - Revisar logs de console
   - Testar todas as funcionalidades principais

---

## 📚 Referências Adicionais

- [NestJS Modules](https://docs.nestjs.com/modules)
- [React TypeScript](https://react-typescript-cheatsheet.netlify.app/)
- [Lucide Icons](https://lucide.dev/icons/)
- [Prisma Client](https://www.prisma.io/docs/concepts/components/prisma-client)

---

**Criado em:** 2026-01-21  
**Versão:** 1.0.0  
**Módulo Base:** ordem_servico v1.0.1
