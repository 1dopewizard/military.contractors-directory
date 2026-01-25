#!/bin/bash

# =============================================================================
# military.contractors Deploy Script
# Run this on the VPS to pull and deploy changes from GitHub
# =============================================================================

set -e  # Exit on error

# Load pnpm path
export PNPM_HOME="$HOME/.local/share/pnpm"
export PATH="$PNPM_HOME:$PATH"

# Configuration
APP_DIR="/var/www/military.contractors"
APP_NAME="military-contractors"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() { echo -e "${GREEN}[✓]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }
info() { echo -e "${BLUE}[→]${NC} $1"; }

echo ""
echo "=========================================="
echo "  Deploying $APP_NAME"
echo "=========================================="
echo ""

cd "$APP_DIR"

# Store current commit
OLD_COMMIT=$(git rev-parse HEAD)

# Pull latest changes
info "Pulling latest changes..."
git pull

# Get new commit
NEW_COMMIT=$(git rev-parse HEAD)

# Check if anything changed
if [ "$OLD_COMMIT" = "$NEW_COMMIT" ]; then
    warn "No changes to deploy (already up to date)"
    exit 0
fi

# Show what changed
info "Changes:"
git log --oneline "$OLD_COMMIT..$NEW_COMMIT"
echo ""

# Check if dependencies changed
if git diff --name-only "$OLD_COMMIT" "$NEW_COMMIT" | grep -qE "^(package\.json|pnpm-lock\.yaml)$"; then
    info "Dependencies changed, running pnpm install..."
    pnpm install
else
    log "Dependencies unchanged, skipping install"
fi

# Build
info "Building application..."
pnpm build

# Reload with zero downtime
info "Reloading application..."
pm2 reload "$APP_NAME"

echo ""
echo "=========================================="
log "Deploy complete!"
echo "=========================================="
echo ""
log "Deployed commit: $(git rev-parse --short HEAD)"
log "Message: $(git log -1 --pretty=%s)"
echo ""
pm2 status "$APP_NAME"
