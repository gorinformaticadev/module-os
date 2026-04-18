# Migracao do legado de Ordem de Servico

Este fluxo foi criado para gerar um seed SQL a partir do dump legado informado pelo time.

## O que o gerador faz

- le o dump MySQL legado
- importa apenas clientes e ordens de servico
- valida cliente por `nome + telefone`
- prefere `celular`; usa `telefone` quando ele for o unico valido
- ignora clientes sem telefone valido
- junta duplicados exatos quando `nome normalizado + telefone normalizado` sao iguais
- preserva a numeracao da OS usando `idOs -> numero`
- associa a OS ao cliente canonico gerado
- preserva o `usuarios_id` legado como UUID sintetico estavel em `usuario_responsavel_id`
- mapeia status legados para o fluxo atual
- gera um relatorio JSON com excecoes para conferencia manual

## Mapeamento de status

- `Orcamento` e `Negociacao` -> `0 ORCAMENTO`
- `Aberto` -> `1 ABERTA`
- `Aguardando Pecas` -> `4 AGUARDANDO_PECAS`
- `Em Andamento` -> `5 EM_EXECUCAO`
- `Finalizado` -> `6 FINALIZADA`
- `Cancelado` -> `7 CANCELADA`
- `Entregue` e `Faturado` -> `8 RETIRADO`
- qualquer status nao reconhecido -> `8 RETIRADO`

## Campos migrados

### Clientes

- `nomeCliente -> name`
- `celular/telefone -> phone_primary`

### Ordens de servico

- `idOs -> numero`
- `dataInicial -> data_abertura`
- `dataFinal -> data_previsao`
- `dataFinal -> data_conclusao`
- `garantia -> garantia_dias`
- `descricaoProduto -> descricao`
- `defeito -> observacoes_cliente`
- `observacoes -> observacoes_internas`
- `laudoTecnico -> laudo_tecnico`
- `valorTotal -> valor_servico`
- `usuarios_id -> usuario_responsavel_id` com UUID sintetico estavel

## Resultado da analise do backup de 2026-04-17

- `600` clientes no legado
- `591` linhas de cliente com telefone valido
- `586` clientes canonicos apos deduplicacao exata
- `9` clientes ignorados por telefone invalido ou ausente
- `5` grupos de duplicados exatos de cliente
- `33` grupos suspeitos com mesmo telefone em nomes diferentes
- `946` ordens de servico no legado
- `931` ordens importaveis
- `15` ordens ignoradas por dependerem de clientes invalidos

## Gerar o seed

```powershell
node .\\module-os\\backend\\seeds\\generate-legacy-os-seed.mjs `
  --dump "D:\\Usuarios\\Servidor\\GORInformatica\\Downloads\\backup17-04-2026 21_04_20\\backup17-04-2026.sql" `
  --tenant-id "<TENANT_ID>" `
  --user-id "<USER_ID>" `
  --out "D:\\Usuarios\\Servidor\\GORInformatica\\Documents\\legacy-os-import.seed.sql" `
  --report "D:\\Usuarios\\Servidor\\GORInformatica\\Documents\\legacy-os-import.report.json"
```

Ou via script:

```powershell
pnpm --dir .\\module-os\\backend run generate:legacy-os-seed -- `
  --dump "D:\\Usuarios\\Servidor\\GORInformatica\\Downloads\\backup17-04-2026 21_04_20\\backup17-04-2026.sql" `
  --tenant-id "<TENANT_ID>" `
  --user-id "<USER_ID>" `
  --out "D:\\Usuarios\\Servidor\\GORInformatica\\Documents\\legacy-os-import.seed.sql" `
  --report "D:\\Usuarios\\Servidor\\GORInformatica\\Documents\\legacy-os-import.report.json"
```

## Conferencia recomendada

- revisar o JSON de relatorio antes da carga
- conferir os clientes invalidos e os grupos suspeitos por telefone
- executar o SQL gerado somente depois da validacao do tenant e do usuario responsavel
