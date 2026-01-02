# Módulo: Ordem de Serviços

Este é um módulo personalizado do Sistema Multitenant para gerenciamento de ordens de serviço.

## Estrutura

```
ordem_servico/
├── module.json           # Configuração do módulo
├── README.md            # Documentação
├── backend/             # Lógica do servidor
│   ├── controllers/     # Controllers REST API
│   ├── services/        # Serviços de negócio
│   ├── dto/            # Data Transfer Objects
│   ├── migrations/     # Migrações do banco
│   └── seeds/          # Dados iniciais
└── frontend/           # Interface do usuário
    ├── components/     # Componentes React
    ├── pages/         # Páginas do módulo
    └── services/      # Serviços do frontend
```

## Funcionalidades

- Dashboard com métricas
- Gerenciamento de ordens de serviço
- Cadastro de clientes
- Cadastro de produtos/serviços
- Configurações do módulo

## Banco de Dados

O módulo cria as seguintes tabelas:

- `mod_ordem_servico_configs` - Configurações do módulo
- `mod_ordem_servico_clients` - Clientes
- `mod_ordem_servico_products` - Produtos/Serviços
- `mod_ordem_servico_notification_schedules` - Agendamentos de notificações

## Permissões

- `ordem_servico.view` - Visualizar o módulo
- `ordem_servico.create` - Criar registros
- `ordem_servico.edit` - Editar registros
- `ordem_servico.delete` - Excluir registros
- `ordem_servico.admin` - Administrar o módulo

## Endpoints da API

- `GET /api/ordem_servico` - Lista registros
- `GET /api/ordem_servico/stats` - Estatísticas do módulo

## Rotas do Frontend

- `/modules/ordem_servico/pages/dashboard` - Dashboard principal
- `/modules/ordem_servico/pages/ordens` - Lista de ordens
- `/modules/ordem_servico/pages/clientes` - Cadastro de clientes
- `/modules/ordem_servico/pages/produtos` - Cadastro de produtos
- `/modules/ordem_servico/pages/configuracoes` - Configurações