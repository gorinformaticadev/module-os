# Módulo Ordem de Serviço (module-os)

## 📋 Descrição

Módulo completo para gestão de ordens de serviço, desenvolvido para o sistema multitenant. Inclui funcionalidades completas de gestão de clientes, produtos, ordens de serviço, permissões e relatórios.

## 🚀 Funcionalidades

### ✅ **Gestão Completa de Ordens de Serviço**
- Criação e edição de ordens de serviço
- Controle de status (Orçamento → Em Execução → Finalizada/Cancelada)
- Histórico completo de alterações
- Geração de PDFs para impressão
- Integração com WhatsApp

### ✅ **Gestão de Clientes**
- Cadastro completo de clientes
- Endereços detalhados
- Controle de status (Ativo/Inativo)
- Histórico de ordens por cliente

### ✅ **Gestão de Produtos/Serviços**
- Cadastro de produtos e serviços
- Controle de preços e custos
- Códigos únicos por tenant
- Soft delete para segurança

### ✅ **Sistema de Permissões Avançado**
- Permissões por usuário individual
- Perfis pré-definidos (Admin, Técnico, Atendente)
- Auditoria completa de alterações
- Controle granular de recursos

### ✅ **Dashboard e Relatórios**
- Dashboard com métricas em tempo real
- Relatórios de performance
- Gráficos e estatísticas
- Exportação de dados

### ✅ **Integrações**
- WhatsApp para notificações
- Sistema de templates para documentos
- Upload de imagens e arquivos
- Notificações em tempo real

## 🏗️ **Arquitetura**

### **Backend (NestJS)**
```
backend/
├── migrations/           # Scripts SQL de migração
├── seeds/               # Dados iniciais
├── clientes/            # Gestão de clientes
├── produtos/            # Gestão de produtos
├── ordens/              # Ordens de serviço
├── configuracoes/       # Configurações do módulo
├── shared/              # Utilitários compartilhados
│   ├── dto/            # Data Transfer Objects
│   ├── guards/         # Guards de permissão
│   ├── services/       # Serviços compartilhados
│   └── interfaces/     # Interfaces TypeScript
└── core/               # Configurações centrais
```

### **Frontend (Next.js + React)**
```
frontend/
├── pages/              # Páginas do módulo
│   ├── dashboard/     # Dashboard principal
│   ├── ordens/        # Gestão de ordens
│   ├── clientes/      # Gestão de clientes
│   ├── produtos/      # Gestão de produtos
│   └── configuracoes/ # Configurações
├── components/         # Componentes React
├── hooks/             # Hooks customizados
├── services/          # Serviços de API
└── types/             # Tipos TypeScript
```

## 📦 **Instalação**

### **Pré-requisitos**
- PostgreSQL 15+
- Node.js 18+
- Sistema multitenant configurado

### **Passos de Instalação**

Se a instalacao for feita pelo menu `Configuracoes > Sistema > Modulos`, nao compacte o repositorio inteiro manualmente.

Use o pacote oficial:

```powershell
.\scripts\gerar-zip-instalador.ps1
```

Depois envie `dist\ordem_servico-installer-<versao>.zip`.

O instalador interno rejeita arquivos shell como `install.sh`, entao o ZIP precisa conter apenas `module.json` na raiz e os diretorios `backend/` e `frontend/` com arquivos permitidos.

Para modulos baseados neste, leia tambem `DOCS/GUIA_ADAPTACAO_MODULOS_BASEADOS_NESTE.md`.

1. **Copiar arquivos para o sistema**
   ```bash
   # Copiar backend
   cp -r module-os/backend/* apps/backend/src/modules/ordem_servico/

   # Copiar frontend
   cp -r module-os/frontend/* apps/frontend/src/app/modules/ordem_servico/
   ```

2. **Executar migração do banco**
   ```bash
   # Conectar ao banco PostgreSQL
   psql "postgresql://user:password@localhost:5432/database"

   # Executar o script de migração
   \i module-os/migration_complete.sql
   ```

3. **Registrar módulo no sistema**
   ```javascript
   // Executar no backend
   const { PrismaClient } = require('@prisma/client');
   const prisma = new PrismaClient();

   await prisma.module.create({
     data: {
       slug: 'ordem_servico',
       name: 'Ordem de Serviços',
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
   
## ?? **Desenvolvimento por Intelig�ncia Artificial (Avan�ado)**

O sistema dita regras estruturais inegoci�veis. Para orientar qualquer IA (Cursor, ChatGPT, Claude) na cria��o de **novos m�dulos** a partir desta base ou desenvolver novos fluxos sem quebrar o m�dulo host, **forne�a a ela nosso prompt mestre**:

?? [**Prompt Ouro para IA (IA_PROMPT_CRIACAO_MODULO.md)**](./DOCS/IA_PROMPT_CRIACAO_MODULO.md)

Leia tamb�m as documenta��es de arquitetura na pasta DOCS/:
- [EMPACOTAMENTO_INSTALADOR_INTERNO.md](./DOCS/EMPACOTAMENTO_INSTALADOR_INTERNO.md) - Regras de gera��o de ZIP de deploy.
- [GUIA_ADAPTACAO_MODULOS_BASEADOS_NESTE.md](./DOCS/GUIA_ADAPTACAO_MODULOS_BASEADOS_NESTE.md) - Regras vitais sobre Controllers e Notifica��es centrais.
- [NOTIFICATIONS_GUIDE.md](./DOCS/NOTIFICATIONS_GUIDE.md) - Documenta��o de alertas cronometrados (End Users).
- [TUTORIAL_EDICAO_MODULO.md](./DOCS/TUTORIAL_EDICAO_MODULO.md) - Tutorial leg�vel cl�ssico de fork manual do M�dulo de Ordem de Servi�o.

## 🔧 **Configuração**

### **Variáveis de Ambiente**
```env
# Configurações específicas do módulo
MODULE_OS_ENABLED=true
MODULE_OS_MAX_FILE_SIZE=10485760
MODULE_OS_ALLOWED_EXTENSIONS=jpg,jpeg,png,pdf
```

### **Permissões Padrão**

O módulo cria automaticamente três perfis de permissão:

- **Admin**: Acesso completo a todas as funcionalidades
- **Técnico**: Acesso a ordens, clientes e produtos (somente leitura)
- **Atendente**: Acesso básico a ordens e clientes

## 📊 **Estrutura do Banco de Dados**

### **Tabelas Principais**
- `mod_ordem_servico_ordens` - Ordens de serviço
- `mod_ordem_servico_clients` - Clientes
- `mod_ordem_servico_products` - Produtos/Serviços
- `mod_ordem_servico_historico` - Histórico de alterações
- `mod_ordem_servico_user_roles` - Papéis dos usuários
- `mod_ordem_servico_user_permissions` - Permissões individuais
- `mod_ordem_servico_profile_permissions` - Permissões por perfil

### **Índices Otimizados**
- Índices por tenant em todas as tabelas
- Índices compostos para consultas frequentes
- Índices únicos para integridade de dados

## 🔐 **Sistema de Permissões**

### **Recursos Disponíveis**
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
- `config_view` - Visualizar configurações
- `config_users` - Gerenciar usuários
- `config_permissions` - Gerenciar permissões
- `config_system` - Configurações do sistema

## 📈 **Monitoramento**

### **Logs Disponíveis**
- Logs de carregamento do módulo
- Logs de operações do banco
- Logs de permissões e auditoria
- Logs de integrações (WhatsApp)

### **Métricas**
- Número de ordens ativas
- Tempo médio de resolução
- Taxa de satisfação do cliente
- Performance das consultas

## 🐛 **Troubleshooting**

### **Módulo não carrega**
1. Verificar se o módulo está registrado no banco
2. Verificar logs em `module_loading_debug.log`
3. Reiniciar o backend

### **Permissões não funcionam**
1. Verificar se as tabelas de permissão foram criadas
2. Executar seeds novamente
3. Verificar configuração do tenant

### **Erros de banco de dados**
1. Verificar conexão com PostgreSQL
2. Executar migração novamente
3. Verificar logs do banco

## 📝 **Logs Importantes**

```
✅ Módulo ordem_servico carregado com sucesso!
✅ OrdensService executando queries no banco de dados
🎯 [Controller] INÍCIO - Buscando ordens
✅ Resultado retornado com sucesso
```

## 🤝 **Contribuição**

Para contribuir com o desenvolvimento do módulo:

1. Faça fork do repositório
2. Crie uma branch para sua feature
3. Commit suas alterações
4. Push para a branch
5. Abra um Pull Request

## 📄 **Licença**

Este módulo é parte do sistema multitenant e segue a mesma licença AGPL-3.0.

## 📞 **Suporte**

Para suporte técnico, entre em contato com a equipe de desenvolvimento ou abra uma issue no repositório.



