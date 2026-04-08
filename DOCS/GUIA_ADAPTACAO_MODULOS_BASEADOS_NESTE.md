# Guia de adaptacao para modulos baseados neste

Este documento resume as mudancas que o sistema host passou a exigir e o que qualquer modulo derivado deste precisa respeitar para funcionar sem erros de instalacao, menu, rotas, notificacoes e crons.

## 1. Mudancas relevantes no sistema host

### 1.1 Prefixo global de API

O backend do sistema host ja aplica o prefixo global `api`.

Por isso, os controllers do modulo nao devem usar:

```ts
@Controller('api/ordem_servico/...')
```

O formato correto e:

```ts
@Controller('ordem_servico/...')
```

Se o modulo repetir `api/`, as rotas reais ficam como `api/api/...` e o frontend recebe `404`.

### 1.2 Integridade fisica do modulo passou a importar junto com o banco

O menu continua sendo carregado a partir do banco, mas o sistema host agora considera tambem a integridade fisica do modulo.

Na pratica:

- o modulo precisa estar `active` no banco
- o backend precisa existir no local esperado
- o frontend precisa existir no local esperado
- o build do frontend precisa conter as paginas do modulo

Se o banco disser que o modulo existe, mas os arquivos nao estiverem corretos, o menu pode ficar fora de sincronia com as rotas reais.

### 1.3 Frontend segue layout fixo de paginas

O host procura paginas em:

```text
apps/frontend/src/app/modules/{module}/{route}/page.tsx
```

Para este modulo, por exemplo:

```text
apps/frontend/src/app/modules/ordem_servico/pages/clientes/page.tsx
```

Depois de instalar ou atualizar o modulo, pode ser necessario rebuild ou restart do frontend para o host enxergar os arquivos novos.

### 1.4 Instalador interno aceita somente o pacote preparado pelo script

Nao compacte o repositorio manualmente. O pacote valido deve ser gerado por:

```powershell
.\scripts\gerar-zip-instalador.ps1
```

O instalador interno rejeita arquivos proibidos, como `install.sh`, e espera:

- `module.json` na raiz do ZIP
- diretorios `backend/` e `frontend/` em layout compativel
- somente arquivos permitidos

Para a versao atual do `module-os`, o script ja trata o Prisma local do modulo durante o empacotamento, adaptando os arquivos obrigatorios para extensoes aceitas pelo instalador interno.

### 1.5 Notificacoes internas agora passam pela stack central

As notificacoes internas do modulo nao devem mais escrever direto na tabela de notificacoes do sistema.

O caminho correto agora e:

- resolver os destinatarios internos do tenant
- criar a notificacao pela stack central
- deixar o gateway central fazer realtime e push

No caso deste modulo, `SYSTEM` e `PUSH` precisam usar os servicos centrais do host.

### 1.6 Crons devem ser registrados na infraestrutura central

O modulo nao deve depender de agendamentos isolados e desconectados do sistema.

A regra recomendada e:

- registrar jobs pelo `CronService` central
- re-registrar os jobs quando configuracoes de notificacao mudarem
- evitar cron local paralelo para o mesmo fluxo

## 2. Requisitos obrigatorios para qualquer modulo derivado

### 2.1 Rotas

- Nunca prefixar controllers com `api/`
- Usar sempre o namespace do modulo, por exemplo `ordem_servico/...`
- Garantir que o frontend aponte para a mesma rota base

### 2.2 Menu e paginas

- Registrar modulo, menus e permissoes no banco
- Garantir que as paginas existam no layout esperado pelo host
- Rebuildar o frontend depois de instalar ou atualizar o modulo

### 2.3 Isolamento multitenant

- Toda busca de usuarios, configuracoes e notificacoes deve filtrar por `tenantId`
- Nunca resolver destinatarios de outro tenant por e-mail, nome ou fallback generico
- Quando existir destinatario explicito, validar que ele pertence ao tenant atual ou a uma excecao controlada, como `SUPER_ADMIN`

### 2.4 Notificacoes internas

- Nao usar `prisma.notification.create(...)` direto dentro do modulo para canais internos
- Usar o servico central de notificacoes do host
- Criar notificacoes por usuario destinatario, nunca como registro generico sem dono
- Restringir canais internos a usuarios internos do tenant

### 2.5 Canais e destinatarios

As combinacoes seguras ficam assim:

- `SYSTEM` ou `PUSH`: apenas usuarios internos (`TECHNICIAN`, `ADMIN`, `SUPER_ADMIN`)
- `EMAIL` e `WHATSAPP`: podem incluir `CLIENT` quando o fluxo for externo

Na UI, canais internos nao devem sugerir `CLIENT` como destino padrao.

### 2.6 Crons e recorrencia

- Registrar jobs no `CronService` central
- Ao salvar configuracoes de notificacao, atualizar o registro dos jobs
- Em notificacoes agendadas, resolver os destinatarios primeiro e gerar uma notificacao por usuario valido

### 2.7 Compatibilidade da UI

- A UI nao deve expor combinacoes que o backend bloqueia
- Regras novas com canal interno devem nascer com destinatario interno
- Troca de canal deve limpar destinatarios invalidos
- Se um tipo de gatilho ainda nao estiver fechado no backend, esconder esse tipo da UI

## 3. Checklist de validacao antes de instalar

Use esta lista para qualquer modulo baseado neste:

1. Controllers sem `api/` no decorator.
2. Paginas frontend no layout `apps/frontend/src/app/modules/{module}/{route}/page.tsx`.
3. Consultas sensiveis filtradas por `tenantId`.
4. Notificacoes internas usando a stack central do host.
5. Jobs registrados pelo `CronService`.
6. UI sem combinacoes invalidas de canal e destinatario.
7. ZIP gerado pelo script oficial.
8. `module.json` presente na raiz do pacote.
9. Nenhum arquivo proibido no ZIP.
10. Rebuild do frontend e restart do backend apos instalar.

## 4. O que foi ajustado neste modulo

Neste modulo `ordem_servico`, os ajustes feitos para atender o host foram:

- remocao do prefixo duplicado `api/` dos controllers
- adequacao do fluxo de notificacoes internas para a stack central
- isolamento correto de destinatarios por tenant
- entrega individual por usuario em fluxos agendados
- registro de crons pela infraestrutura central
- endurecimento da UI para impedir `SYSTEM` com `CLIENT`
- empacotamento obrigatorio via script oficial

## 5. Referencias deste repositorio

- `README.md`
- `backend/README.md`
- `DOCS/EMPACOTAMENTO_INSTALADOR_INTERNO.md`
- `DOCS/NOTIFICATIONS_GUIDE.md`
