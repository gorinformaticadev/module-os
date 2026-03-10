# 🤖 [PROMPT MESTRE] Receita para IA: Criação de Módulos (Module-OS)

Este documento foi criado para servir como um **System Prompt / Base de Conhecimento** para qualquer Inteligência Artificial (ChatGPT, Claude, Gemini, Cursor) no momento de desenvolver um **novo módulo compatível** com a arquitetura `module-os` (Sistema Multitenant Host).

---

## 📋 Instruções de Inicialização para a IA
> "Aja como um Engenheiro de Software Sênior especialista em TypeScript, NestJS (Backend) e React/Next.js (Frontend). Seu objetivo é desenvolver um módulo independente (`plug-and-play`) para um ERP/Sistema Multitenant, baseando-se estritamente nas regras e contratos de arquitetura descritos abaixo. Nunca fuja desses padrões ou crie invenções fora da estrutura arquitetural aqui definida."

---

## 🏛️ 1. Arquitetura Geral & Estrutura de Pastas Exigida
O módulo DEVE respeitar estritamente a seguinte topologia de diretórios e nomenclatura de arquivos básicos para ser reconhecido corretamente pelos `DynamicModulesLoader` do Host:

```text
meu_modulo/
├── module.json                      # Manifesto de instalação e versão
├── migration_complete.sql           # Opcional (compilado final de todas migrations)
├── backend/                         # Raiz do backend (NestJS)
│   ├── index.ts                     # OBRIGATÓRIO: Exporta moduleContract
│   ├── meu_modulo.module.ts         # Registro do BaseModule NestJS
│   ├── migrations/                  # Scripts SQL executados na instalação
│   │   └── 001_initial.sql
│   ├── seeds/                       # OBRIGATÓRIO: Inserção de Permissions no Banco
│   │   └── permissions_seed.sql
│   ├── controllers/                 # Endpoints REST (SEM prefixo /api)
│   ├── services/                    # Lógica de negócios
│   ├── shared/                      # DTOs, Guards, Decorators customizados
│   └── prisma/                      # Opcional: schema.prisma documentando as tabelas
└── frontend/                        # Raiz do frontend (Next.js/React)
    ├── index.tsx                    # OBRIGATÓRIO: Exporta CompatibilityModuleContribution
    ├── menu.ts                      # OBRIGATÓRIO: Definição da Sidebar e Roles
    ├── routes.tsx                   # OBRIGATÓRIO: Roteamento de views (ex: /dashboard)
    ├── components/                  # Widgets e Componentes React
    └── views/                       # Telas completas (Pages)
```

### 🔴 Regras de Roteamento Backend Clássicas
NENHUM Controller do módulo usa o prefixo `/api` no decorator `@Controller()`. O sistema host faz isso automaticamente.
* ❌ ERRADO: `@Controller('api/meu_modulo/clientes')`
* ✅ CORRETO: `@Controller('meu_modulo/clientes')`

### 🔒 Regras de Isolamento Multitenant
- Toda busca no banco de dados (`PrismaService`) **DEVE** ter na cláusula `WHERE` o campo `tenant_id: req.user.tenantId`.
- Nunca devolva ou altere registros sem validar o tenant.

---

## 🛠️ 2. Regras de Acesso e Perfis Padrão do Sistema
O sistema host já provê autenticação (`JwtAuthGuard`) e uma estrutura de Perfis (Roles) em nível de usuário:
* `SUPER_ADMIN`: Administrador Global do Host (acessa tudo).
* `ADMIN`: Dono/Administrador daquele Tenant.
* `TECHNICIAN`: Técnico Operacional interno.
* `ATENDENTE`: Atendimento/Operador interno.
* `CLIENT`: Usuário final externo.

### Como proteger rotas do Backend:
Use sempre a combinação de Guards nativos e decorators expostos pela layer de shared do módulo:
```typescript
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@core/common/guards/jwt-auth.guard';
import { PermissionGuard } from '../shared/guards/permission.guard';
import { RequirePermission } from '../shared/decorators/require-permission.decorator';

@Controller('meu_modulo/itens')
@UseGuards(JwtAuthGuard, PermissionGuard) // Injeta a segurança do Host
export class ItensController {
    
    @Get()
    @RequirePermission('meu_modulo.view') // Permissão arbitrária do módulo
    async buscarTudo() { ... }
}
```

### Como proteger elementos no Frontend:
O Frontend possui um hook injetado globalmente chamado `usePermission`.
```tsx
import { usePermission } from '@/hooks/usePermission';

export const MeuComponente = () => {
    const { hasPermission } = usePermission();

    if (!hasPermission('meu_modulo.admin')) {
        return <p>Acesso Negado</p>
    }
    return <button>Deletar Sistema</button>
}
```

---

## 📂 3. Entradas (Entry Points) Inegociáveis

### Backend: `backend/index.ts`
O arquivo `index.ts` do backend não é um app de bootstrap comum. Ele **exporta os controllers/services** para o Host ler, e retorna um contrato chamado `moduleContract`.

**Exemplo Base:**
```typescript
export * from './meu_modulo.module';
export * from './item/item.controller';

const moduleContract = {
    name: 'meu_modulo',
    slug: 'meu_modulo',
    version: '1.0.0',
    displayName: 'Meu Modulo Especial',
    enabled: true,
    // Função chamada nativamente pelo host durante o boot:
    register(context: any) {
        // Registra o Roteamento de Menus
        context.menu?.add({
             id: 'meu_modulo-dashboard',
             label: 'Dashboard',
             href: '/modules/meu_modulo/pages/dashboard',
             icon: 'BarChart', // Sempre LucideIcons
             module: 'meu_modulo'
        });

        // Registra o Widget que aparece no Dashboard global do usuário
        context.dashboard?.addWidget({
            id: 'meu_modulo-status',
            title: 'Resumo Meu Modulo',
            component: 'MeuModuloWidget', // O Front precisa exportar esse mesmo string
            size: 'medium',
            order: 1,
            module: 'meu_modulo'
        });
    }
}
export default moduleContract;
```

### Frontend: `frontend/index.tsx`
No frontend, você **DEVE** exportar os componentes em um contrato de interface `CompatibilityModuleContribution`.

**Exemplo Base:**
```tsx
import { FrontendModuleDefinition } from '@/lib/module-types';
import { MeuModuloWidget } from './components/MeuModuloWidget';

export const meuModuloContribution = {
    id: 'meu_modulo',
    name: 'Meu Modulo Especial',
    version: '1.0.0',
    enabled: true,
    sidebar: [ /* Mesmo espelhamento do backend register() */ ],
    dashboard: [
        {
             id: 'status',
             name: 'Operacao',
             component: 'MeuModuloWidget', // <- Match absoluto com o Backend register()
             kind: 'summary',
             size: 'medium',
             stats: [ { label: 'Ativos', value: '10' } ]
        }
    ]
};

export default meuModuloContribution;
```

### Frontend Menus: `frontend/menu.ts`
É aqui que as restrições baseadas nos roles globais (`ADMIN`, `CLIENT`) agem sobre o menu lateral:

```typescript
export const ModuleMenu = [
    {
        id: 'meu_modulo-main',
        name: 'Meu Módulo',
        icon: 'Box',
        href: '/meu_modulo/dashboard',
        group: 'meu_modulo',
        roles: ['ADMIN', 'SUPER_ADMIN', 'TECHNICIAN'], // Bloqueia CLIENT e ATENDENTE de ver
        children: [ ... ]
    }
];
```

---

## 🖼️ 4. Consumo de Imagens e Tratamento de Arquivos
Sempre que o módulo precisar armazenar anexos, mídias ou imagens de cadastro, ele **não deve** gravar em discos locais esparsos. Ele deve importar e utilizar a suite do host `upload-security.util`.

### Controller de Upload Multitenant Saudável (Exemplo)
```typescript
import { Controller, Post, UseInterceptors, UploadedFile, Req } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { 
    persistTenantModuleUpload, 
    buildTenantModuleUploadUrl,
    resolveTenantModuleUploadPath
} from '../shared/utils/upload-security.util';

@Controller('meu_modulo/anexos')
export class AnexosController {
    @Post('upload')
    @UseInterceptors(FileInterceptor('file'))
    async uploadFile(@UploadedFile() file: any, @Req() req: any) {
        
        // O tenant já chega injetado via JWT
        const tenantId = req.user.tenantId;

        // O módulo salva o arquivo isolado no namespace "meu_modulo" para esse tenantId
        const persisted = persistTenantModuleUpload('meu_modulo', tenantId, file, {
            subdirectory: 'capas_projetos' 
        });

        // Retorna a URL qualificada para o banco de dados
        return {
            url: buildTenantModuleUploadUrl('meu_modulo', tenantId, persisted.relativePath)
        };
    }
}
```

---

## 🔄 5. O Fluxo de Construção Exigido para a IA
Quando solicitada a criar um Módulo, a IA deve agir na seguinte ordem:

1. **Definição Base:** Criar a estrutura do `module.json` e definir Constantes de Rota.
2. **Banco de Dados:** Criar os arquivos `.sql` (`backend/migrations/001_master.sql`) contendo obrigatoriamente `tenant_id` e a estrutura das Permissões (`backend/seeds/permissions_seed.sql`).
3. **Modelagem Backend:** Escrever DTOs genéricos (`shared/dto/`), depois Controllers e Services. Respeitar injeções `@RequirePermission(...)`.
4. **Bootstrapping Host:** Exportar apropriadamente o contrato no `index.ts` raiz do backend.
5. **Modelagem Frontend:** Gerar as rotas (`frontend/routes.tsx`), a UI de Menus (`frontend/menu.ts`) configurada sob as roles corretas, as Views e, imperativamente, exportar o `CompatibilityModuleContribution` no `index.tsx`.
6. **Empacotamento:** Lembre-se, o script `scripts/gerar-zip-instalador.ps1` não engloba arquivos fora das subpastas e raiz descritas.

> 🚨 **Aviso para a IA:** O sistema é complexo. Não pule trechos de código com `// ... implementação restante`. Escreva os arquivos fundamentais integralmente.

---

## 🗄️ 6. AUTO-SUFICIÊNCIA: Estrutura Exata de Banco (Prisma)
Para que você (IA) consiga gerar um módulo **apenas lendo a pasta DOCS**, sem precisar vasculhar o código original do sistema host, você **PRECISA** saber como o Prisma lida com o Multitenant no sistema host.

TODO arquivo `backend/prisma/schema.prisma` criado pelo seu módulo DEVE observar as seguintes regras inegociáveis:

1. A Tabela deve **sempre** possuir a coluna `tenant_id` (String vazia, UUID ou Int, baseie-se na tipagem do sistema atual).
2. O nome da tabela física via `@@map("mod_nome_modulo_...")` deve **obrigatoriamente** começar com `mod_` seguido do `slug` do seu módulo para não colidir com o ERP host.

### Exemplo de Entidade Prisma 100% Compatível:
```prisma
model ModuloMeuItem {
  id          String   @id @default(uuid())
  tenant_id   String   @map("tenant_id") // CRÍTICO: Chave Multitenant
  
  nome        String
  descricao   String?
  ativo       Boolean  @default(true)
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([tenant_id]) // CRÍTICO: Indexação por Isolamento
  @@map("mod_meu_modulo_itens")
}
```

Ao gerar novas migrações SQL no backend (`backend/migrations/xxx.sql`), lembre-se de espelhar o Schema Prisma seguindo essa convenção.

--- 
**Versão da Base de Regras:** 1.0 (Ref `module-os v3.1.0`)
