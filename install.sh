#!/bin/bash

# ═══════════════════════════════════════════════════════════════════════════
# Script de Instalação do Módulo Ordem de Serviço
# Versão: 1.0.0
# Data: 2026-01-24
# ═══════════════════════════════════════════════════════════════════════════

set -e  # Parar em caso de erro

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para log
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[ERRO] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[AVISO] $1${NC}"
}

info() {
    echo -e "${BLUE}[INFO] $1${NC}"
}

# Verificar se estamos na raiz do projeto
if [ ! -d "apps/backend" ] || [ ! -d "apps/frontend" ]; then
    error "Este script deve ser executado da raiz do projeto!"
    exit 1
fi

log "🚀 Iniciando instalação do Módulo Ordem de Serviço..."

# 1. Verificar se o backend está rodando
info "Verificando se o backend está em execução..."
if curl -s http://localhost:4000/health > /dev/null 2>&1; then
    warn "Backend está rodando. Recomenda-se pará-lo durante a instalação."
    read -p "Deseja continuar mesmo assim? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        info "Instalação cancelada pelo usuário."
        exit 0
    fi
fi

# 2. Copiar arquivos do backend
log "📁 Copiando arquivos do backend..."
if [ -d "apps/backend/src/modules/ordem_servico" ]; then
    warn "Pasta ordem_servico já existe no backend. Fazendo backup..."
    mv "apps/backend/src/modules/ordem_servico" "apps/backend/src/modules/ordem_servico.backup.$(date +%s)"
fi

mkdir -p "apps/backend/src/modules/ordem_servico"
cp -r module-os/backend/* apps/backend/src/modules/ordem_servico/

# 3. Copiar arquivos do frontend
log "📁 Copiando arquivos do frontend..."
if [ -d "apps/frontend/src/app/modules/ordem_servico" ]; then
    warn "Pasta ordem_servico já existe no frontend. Fazendo backup..."
    mv "apps/frontend/src/app/modules/ordem_servico" "apps/frontend/src/app/modules/ordem_servico.backup.$(date +%s)"
fi

mkdir -p "apps/frontend/src/app/modules/ordem_servico"
cp -r module-os/frontend/* apps/frontend/src/app/modules/ordem_servico/

# 4. Executar migração do banco
log "🗄️ Executando migração do banco de dados..."

# Verificar se psql está disponível
if ! command -v psql &> /dev/null; then
    error "psql não encontrado. Instale o PostgreSQL client."
    exit 1
fi

# Tentar executar a migração
info "Conectando ao banco de dados..."
if psql "$DATABASE_URL" -f module-os/migration_complete.sql 2>/dev/null; then
    log "✅ Migração executada com sucesso!"
else
    warn "Não foi possível executar migração automaticamente."
    info "Execute manualmente:"
    echo "psql \"$DATABASE_URL\" -f module-os/migration_complete.sql"
fi

# 5. Registrar módulo no sistema
log "📝 Registrando módulo no sistema..."
cd apps/backend

# Executar o script de instalação do módulo (agora incluído nos arquivos do backend)
MODULE_INSTALL_SCRIPT="src/modules/ordem_servico/install.js"

if [ -f "$MODULE_INSTALL_SCRIPT" ]; then
    log "⚙️ Executando script de registro do módulo: $MODULE_INSTALL_SCRIPT"
    if node "$MODULE_INSTALL_SCRIPT"; then
        log "✅ Módulo registrado com sucesso!"
    else
        error "❌ Falha ao registrar o módulo via script."
        # Não falha a instalação inteira, mas avisa
    fi
else
    warn "⚠️ Script de instalação não encontrado em: $MODULE_INSTALL_SCRIPT"
    warn "O módulo pode não ter sido registrado corretamente."
fi

cd ../..

# 6. Verificar instalação
log "🔍 Verificando instalação..."

# Verificar se arquivos foram copiados
if [ -f "apps/backend/src/modules/ordem_servico/ordem_servico.module.ts" ]; then
    log "✅ Arquivos do backend copiados com sucesso"
else
    error "❌ Falha ao copiar arquivos do backend"
fi

if [ -f "apps/frontend/src/app/modules/ordem_servico/routes.tsx" ]; then
    log "✅ Arquivos do frontend copiados com sucesso"
else
    error "❌ Falha ao copiar arquivos do frontend"
fi

# 7. Próximos passos
log ""
log "🎉 Instalação concluída!"
log ""
info "📋 PRÓXIMOS PASSOS:"
echo "1. Reinicie o backend:"
echo "   cd apps/backend && npm run start:dev"
echo ""
echo "2. Reinicie o frontend:"
echo "   cd apps/frontend && npm run dev"
echo ""
echo "3. Acesse o módulo em:"
echo "   http://localhost:5000/ordem_servico"
echo ""
echo "4. Verifique os logs do backend para confirmar o carregamento:"
echo "   '✅ Módulo ordem_servico carregado com sucesso!'"
echo ""
warn "⚠️ IMPORTANTE: Se o módulo não carregar, verifique os logs em:"
echo "   apps/backend/module_loading_debug.log"

log "Instalação finalizada com sucesso! 🚀"