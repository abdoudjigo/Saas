#!/bin/bash

# Configurations (modifiables via variables d'environnement)
TARGET="${DEPLOY_TARGET:-production}"
SHADOW_MODE="${SHADOW_MODE:-false}"
SSH_KEY="${SSH_KEY:-~/.ssh/id_rsa}"
REMOTE_USER="${REMOTE_USER:-admin}"
REMOTE_HOST="${REMOTE_HOST:-your-server.com}"
APP_DIR="${APP_DIR:-/var/www/ai-video-saas}"
BUILD_DIR="${BUILD_DIR:-./dist}"
SECRET_KEY="${SECRET_KEY:-}"

# Couleurs pour le logging
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Fonction pour les messages d'erreur
error_exit() {
  echo -e "${RED}[ERREUR] $1${NC}" >&2
  exit 1
}

# Vérification des dépendances
check_dependencies() {
  local deps=("rsync" "ssh" "npm" "git")
  for dep in "${deps[@]}"; do
    if ! command -v "$dep" &> /dev/null; then
      error_exit "$dep n'est pas installé"
    fi
  done
}

# Build spécial pour le mode shadow
shadow_build() {
  echo -e "${YELLOW}⚡ Construction du mode shadow...${NC}"
  
  # Override des variables d'environnement
  export VUE_APP_API_SECRET="$SECRET_KEY"
  export VUE_APP_SHADOW_MODE=true

  npm run build -- --mode=production || error_exit "Échec du build shadow"
  
  # Injection de scripts supplémentaires
  cp ./scripts/shadow-inject.js "$BUILD_DIR"/static/js/
}

# Déploiement standard
deploy() {
  echo -e "${GREEN}🚀 Déploiement en cours vers $TARGET...${NC}"
  
  # Construction
  if [ "$SHADOW_MODE" = "true" ]; then
    shadow_build
  else
    npm run build || error_exit "Échec du build"
  fi

  # Synchronisation
  rsync -avz --delete -e "ssh -i $SSH_KEY" \
    "$BUILD_DIR"/ "$REMOTE_USER"@"$REMOTE_HOST":"$APP_DIR" || error_exit "Échec de la synchronisation"

  # Post-déploiement
  ssh -i "$SSH_KEY" "$REMOTE_USER"@"$REMOTE_HOST" <<EOF
    cd $APP_DIR
    pm2 restart video-app || echo -e "${YELLOW}⚠ PM2 non configuré${NC}"
EOF
}

# Nettoyage des traces
cleanup() {
  echo -e "${YELLOW}🧹 Nettoyage...${NC}"
  rm -rf "$BUILD_DIR"
  unset VUE_APP_API_SECRET
  unset VUE_APP_SHADOW_MODE
}

# Execution principale
main() {
  check_dependencies
  
  case "$TARGET" in
    production|staging|shadow)
      deploy
      ;;
    *)
      error_exit "Cible de déploiement invalide: $TARGET"
      ;;
  esac

  cleanup
  echo -e "${GREEN}✅ Déploiement réussi!${NC}"
}

main "$@"