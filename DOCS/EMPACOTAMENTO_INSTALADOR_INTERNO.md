# Empacotamento para o instalador interno

## Objetivo

Este documento descreve como gerar um ZIP compativel com o instalador interno de modulos do sistema, acessado em `Configuracoes > Sistema > Modulos`.

O foco aqui nao e a rota externa `/install`.

## Script oficial deste repositorio

O repositorio agora possui um script dedicado para gerar um pacote limpo:

```powershell
.\scripts\gerar-zip-instalador.ps1
```

Saida padrao:

```text
dist\ordem_servico-installer-<versao>.zip
dist\ordem_servico-installer-<versao>.files.txt
```

Exemplo:

```powershell
.\scripts\gerar-zip-instalador.ps1 -OutputDir dist
```

## O que entra no ZIP

O script inclui apenas o que o instalador interno realmente precisa:

- `module.json` na raiz do ZIP
- arquivos de `backend/`
- arquivos de `frontend/`
- `backend/migrations/*.sql`
- `backend/seeds/*.sql`
- `backend/module.config.json`, quando existir

## O que fica de fora

O script remove do pacote tudo que costuma quebrar ou poluir a instalacao:

- `.gitignore`
- `.gitattributes`
- `.env`
- `node_modules`
- `package-lock.json`
- `install.sh`
- scripts auxiliares fora do runtime
- documentacao auxiliar
- `.qoder/`
- `DOCS/`
- `scripts/`
- `backend/module.json`

## Por que `backend/module.json` fica de fora

O instalador interno copia:

- `module.json` da raiz para o backend instalado
- `backend/*` tambem para o backend instalado

Se o pacote carregar `module.json` na raiz e `backend/module.json`, os dois arquivos disputam o mesmo destino final.

Para evitar sobrescrita ambigua, o script usa apenas o `module.json` da raiz como manifest principal do pacote.

## Estrutura final do ZIP

O resultado fica neste formato:

```text
ordem_servico-installer-<versao>.zip
  module.json
  backend/
    index.ts
    ordem_servico.module.ts
    routes.ts
    module.config.json
    clientes/...
    configuracoes/...
    core/...
    notifications/...
    ordens/...
    produtos/...
    shared/...
    migrations/*.sql
    seeds/*.sql
  frontend/
    index.tsx
    menu.ts
    module-manifest.ts
    routes.tsx
    components/...
    hooks/...
    pages/...
    services/...
    types/...
```

## Regras importantes do instalador interno

- O `module.json` precisa existir na raiz do ZIP.
- O instalador aceita `backend/` e `frontend/` no pacote.
- `migrations` e `seeds` devem ficar dentro de `backend/`.
- Arquivos com extensoes fora da allowlist do instalador podem invalidar o pacote.
- Arquivos de shell como `*.sh` nao devem entrar no ZIP.

## Como validar antes de subir

1. Rode o script de empacotamento.
2. Confira o arquivo `dist\ordem_servico-installer-<versao>.files.txt`.
3. Verifique se o ZIP contem `module.json`, `backend/` e `frontend/`.
4. Suba o ZIP no instalador interno.

## Resultado esperado apos a instalacao

- backend instalado em `apps/backend/src/modules/ordem_servico`
- frontend instalado em `apps/frontend/src/app/modules/ordem_servico`
- card do dashboard principal lido a partir do `module.json` instalado
- menus carregados a partir do manifest do modulo

## Observacao sobre ambiente

No projeto principal, o instalador interno agora permite upload em `development` automaticamente.
Fora de `development`, o sistema continua bloqueando operacoes mutaveis por padrao e so libera com `ENABLE_MODULE_UPLOAD=true`.
