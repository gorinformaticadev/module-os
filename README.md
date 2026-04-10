# MÃ³dulo Ordem de ServiÃ§o (module-os)

## ðŸ“‹ DescriÃ§Ã£o

MÃ³dulo completo para gestÃ£o de ordens de serviÃ§o, desenvolvido para o sistema multitenant. Inclui funcionalidades completas de gestÃ£o de clientes, produtos, ordens de serviÃ§o, permissÃµes e relatÃ³rios.

## ðŸš€ Funcionalidades

### âœ… **GestÃ£o Completa de Ordens de ServiÃ§o**
- CriaÃ§Ã£o e ediÃ§Ã£o de ordens de serviÃ§o
- Controle de status (OrÃ§amento â†’ Em ExecuÃ§Ã£o â†’ Finalizada/Cancelada)
- HistÃ³rico completo de alteraÃ§Ãµes
- GeraÃ§Ã£o de PDFs para impressÃ£o
- IntegraÃ§Ã£o com WhatsApp

### âœ… **GestÃ£o de Clientes**
- Cadastro completo de clientes
- EndereÃ§os detalhados
- Controle de status (Ativo/Inativo)
- HistÃ³rico de ordens por cliente

### âœ… **GestÃ£o de Produtos/ServiÃ§os**
- Cadastro de produtos e serviÃ§os
- Controle de preÃ§os e custos
- CÃ³digos Ãºnicos por tenant
- Soft delete para seguranÃ§a

### âœ… **Sistema de PermissÃµes AvanÃ§ado**
- PermissÃµes por usuÃ¡rio individual
- Perfis prÃ©-definidos (Admin, TÃ©cnico, Atendente)
- Auditoria completa de alteraÃ§Ãµes
- Controle granular de recursos

### âœ… **Dashboard e RelatÃ³rios**
- Dashboard com mÃ©tricas em tempo real
- RelatÃ³rios de performance
- GrÃ¡ficos e estatÃ­sticas
- ExportaÃ§Ã£o de dados

### âœ… **IntegraÃ§Ãµes**
- WhatsApp para notificaÃ§Ãµes
- Sistema de templates para documentos
- Upload de imagens e arquivos
- NotificaÃ§Ãµes em tempo real

## ðŸ�—ï¸� **Arquitetura**

### **Backend (NestJS)**
```
backend/
â”œâ”€â”€ migrations/           # Scripts SQL de migraÃ§Ã£o
â”œâ”€â”€ seeds/               # Dados iniciais
â”œâ”€â”€ clientes/            # GestÃ£o de clientes
â”œâ”€â”€ produtos/            # GestÃ£o de produtos
â”œâ”€â”€ ordens/              # Ordens de serviÃ§o
â”œâ”€â”€ configuracoes/       # ConfiguraÃ§Ãµes do mÃ³dulo
â”œâ”€â”€ shared/              # UtilitÃ¡rios compartilhados
â”‚   â”œâ”€â”€ dto/            # Data Transfer Objects
â”‚   â”œâ”€â”€ guards/         # Guards de permissÃ£o
â”‚   â”œâ”€â”€ services/       # ServiÃ§os compartilhados
â”‚   â””â”€â”€ interfaces/     # Interfaces TypeScript
â””â”€â”€ core/               # ConfiguraÃ§Ãµes centrais
```

### **Frontend (Next.js + React)**
```
frontend/
â”œâ”€â”€ pages/              # PÃ¡ginas do mÃ³dulo
â”‚   â”œâ”€â”€ dashboard/     # Dashboard principal
â”‚   â”œâ”€â”€ ordens/        # GestÃ£o de ordens
â”‚   â”œâ”€â”€ clientes/      # GestÃ£o de clientes
â”‚   â”œâ”€â”€ produtos/      # GestÃ£o de produtos
â”‚   â””â”€â”€ configuracoes/ # ConfiguraÃ§Ãµes
â”œâ”€â”€ components/         # Componentes React
â”œâ”€â”€ hooks/             # Hooks customizados
â”œâ”€â”€ services/          # ServiÃ§os de API
â””â”€â”€ types/             # Tipos TypeScript
```

## ðŸ“¦ **InstalaÃ§Ã£o**

### **PrÃ©-requisitos**
- PostgreSQL 15+
- Node.js 18+
- Sistema multitenant configurado

### **Passos de InstalaÃ§Ã£o**

Se a instalacao for feita pelo menu `Configuracoes > Sistema > Modulos`, nao compacte o repositorio inteiro manualmente.

Use o script oficial do compilador:

```powershell
.\scripts\gerar-zip-instalador.ps1
```

**Nota Arquitetural Automática:** O script `gerar-zip-instalador.ps1` invoca o comando `npx prisma generate` automaticamente antes de empacotar. O Prisma cria uma pasta isolada (`backend/generated`) para o módulo funcionar de forma independente. O empacotador preserva arquivos nativos `.wasm` perfeitamente compatíveis com o instalador principal atualizado do Pluggor.

Depois envie o pacote `dist\ordem_servico-installer-<versao>.zip`.

Para modulos baseados neste, leia tambem `DOCS/GUIA_ADAPTACAO_MODULOS_BASEADOS_NESTE.md`.

1. **Copiar arquivos para o sistema**
   ```bash
   # Copiar backend
   cp -r module-os/backend/* apps/backend/src/modules/ordem_servico/

   # Copiar frontend
   cp -r module-os/frontend/* apps/frontend/src/app/modules/ordem_servico/
   ```

2. **Executar migraÃ§Ã£o do banco**
   ```bash
   # Conectar ao banco PostgreSQL
   psql "postgresql://user:password@localhost:5432/database"

   # Executar o script de migraÃ§Ã£o
   \i module-os/migration_complete.sql
   ```

3. **Registrar mÃ³dulo no sistema**
   ```javascript
   // Executar no backend
   const { PrismaClient } = require('@prisma/client');
   const prisma = new PrismaClient();

   await prisma.module.create({
     data: {
       slug: 'ordem_servico',
       name: 'Ordem de ServiÃ§os',
       version: '3.1.0',
       status: 'active',
       hasBackend: true,
       hasFrontend: true
     }
   });
   ```

4. **Reiniciar o backend**
   ```bash
   cd apps/backend
   npm run start:dev
   
## ?? **Desenvolvimento por Inteligência Artificial (Avançado)**

O sistema dita regras estruturais inegociáveis. Para orientar qualquer IA (Cursor, ChatGPT, Claude) na criação de **novos módulos** a partir desta base ou desenvolver novos fluxos sem quebrar o módulo host, **forneça a ela nosso prompt mestre**:

?? [**Prompt Ouro para IA (IA_PROMPT_CRIACAO_MODULO.md)**](./DOCS/IA_PROMPT_CRIACAO_MODULO.md)

Leia também as documentações de arquitetura na pasta DOCS/:
- [EMPACOTAMENTO_INSTALADOR_INTERNO.md](./DOCS/EMPACOTAMENTO_INSTALADOR_INTERNO.md) - Regras de geração de ZIP de deploy.
- [GUIA_ADAPTACAO_MODULOS_BASEADOS_NESTE.md](./DOCS/GUIA_ADAPTACAO_MODULOS_BASEADOS_NESTE.md) - Regras vitais sobre Controllers e Notificações centrais.
- [NOTIFICATIONS_GUIDE.md](./DOCS/NOTIFICATIONS_GUIDE.md) - Documentação de alertas cronometrados (End Users).
- [TUTORIAL_EDICAO_MODULO.md](./DOCS/TUTORIAL_EDICAO_MODULO.md) - Tutorial legível clássico de fork manual do Módulo de Ordem de Serviço.

## ðŸ”§ **ConfiguraÃ§Ã£o**

### **VariÃ¡veis de Ambiente**
```env
# ConfiguraÃ§Ãµes especÃ­ficas do mÃ³dulo
MODULE_OS_ENABLED=true
MODULE_OS_MAX_FILE_SIZE=10485760
MODULE_OS_ALLOWED_EXTENSIONS=jpg,jpeg,png,pdf
```

### **PermissÃµes PadrÃ£o**

O mÃ³dulo cria automaticamente trÃªs perfis de permissÃ£o:

- **Admin**: Acesso completo a todas as funcionalidades
- **TÃ©cnico**: Acesso a ordens, clientes e produtos (somente leitura)
- **Atendente**: Acesso bÃ¡sico a ordens e clientes

## ðŸ“Š **Estrutura do Banco de Dados**

### **Tabelas Principais**
- `mod_ordem_servico_ordens` - Ordens de serviÃ§o
- `mod_ordem_servico_clients` - Clientes
- `mod_ordem_servico_products` - Produtos/ServiÃ§os
- `mod_ordem_servico_historico` - HistÃ³rico de alteraÃ§Ãµes
- `mod_ordem_servico_user_roles` - PapÃ©is dos usuÃ¡rios
- `mod_ordem_servico_user_permissions` - PermissÃµes individuais
- `mod_ordem_servico_profile_permissions` - PermissÃµes por perfil

### **Ã�ndices Otimizados**
- Ã�ndices por tenant em todas as tabelas
- Ã�ndices compostos para consultas frequentes
- Ã�ndices Ãºnicos para integridade de dados

## ðŸ”� **Sistema de PermissÃµes**

### **Recursos DisponÃ­veis**
- `dashboard_view` - Visualizar dashboard
- `orders_view` - Visualizar ordens
- `orders_create` - Criar ordens
- `orders_edit` - Editar ordens
- `orders_delete` - Excluir ordens
- `clients_view` - Visualizar clientes
- `clients_create` - Criar clientes
- `clients_edit` - Editar clientes
- `clients_delete` - Excluir clientes
- `products_view` - Visualizar produtos
- `products_create` - Criar produtos
- `products_edit` - Editar produtos
- `products_delete` - Excluir produtos
- `config_view` - Visualizar configuraÃ§Ãµes
- `config_users` - Gerenciar usuÃ¡rios
- `config_permissions` - Gerenciar permissÃµes
- `config_system` - ConfiguraÃ§Ãµes do sistema

## ðŸ“ˆ **Monitoramento**

### **Logs DisponÃ­veis**
- Logs de carregamento do mÃ³dulo
- Logs de operaÃ§Ãµes do banco
- Logs de permissÃµes e auditoria
- Logs de integraÃ§Ãµes (WhatsApp)

### **MÃ©tricas**
- NÃºmero de ordens ativas
- Tempo mÃ©dio de resoluÃ§Ã£o
- Taxa de satisfaÃ§Ã£o do cliente
- Performance das consultas

## ðŸ�› **Troubleshooting**

### **MÃ³dulo nÃ£o carrega**
1. Verificar se o mÃ³dulo estÃ¡ registrado no banco
2. Verificar logs em `module_loading_debug.log`
3. Reiniciar o backend

### **PermissÃµes nÃ£o funcionam**
1. Verificar se as tabelas de permissÃ£o foram criadas
2. Executar seeds novamente
3. Verificar configuraÃ§Ã£o do tenant

### **Erros de banco de dados**
1. Verificar conexÃ£o com PostgreSQL
2. Executar migraÃ§Ã£o novamente
3. Verificar logs do banco

## ðŸ“� **Logs Importantes**

```
âœ… MÃ³dulo ordem_servico carregado com sucesso!
âœ… OrdensService executando queries no banco de dados
ðŸŽ¯ [Controller] INÃ�CIO - Buscando ordens
âœ… Resultado retornado com sucesso
```

## ðŸ¤� **ContribuiÃ§Ã£o**

Para contribuir com o desenvolvimento do mÃ³dulo:

1. FaÃ§a fork do repositÃ³rio
2. Crie uma branch para sua feature
3. Commit suas alteraÃ§Ãµes
4. Push para a branch
5. Abra um Pull Request

## ðŸ“„ **LicenÃ§a**

Este mÃ³dulo Ã© parte do sistema multitenant e segue a mesma licenÃ§a AGPL-3.0.

## ðŸ“ž **Suporte**

Para suporte tÃ©cnico, entre em contato com a equipe de desenvolvimento ou abra uma issue no repositÃ³rio.



