#!/usr/bin/env bash
#
# setup-vps.sh - Set up VPS for military.contractors deployment
#
# Installs:
#   - System dependencies (tmux, git, curl, etc.)
#   - Node.js via nvm
#   - pnpm package manager
#
# Supports:
#   - Ubuntu/Debian (apt)
#   - Arch Linux (pacman)
#   - RHEL/CentOS/Fedora (dnf/yum)
#
# Usage:
#   curl -fsSL https://raw.githubusercontent.com/YOUR_REPO/main/scripts/setup-vps.sh | bash
#   # or after cloning:
#   ./scripts/setup-vps.sh
#

set -e

# Configuration
NODE_VERSION="20"
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." 2>/dev/null && pwd)" || PROJECT_ROOT="$PWD"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[setup]${NC} $1"; }
log_success() { echo -e "${GREEN}[setup]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[setup]${NC} $1"; }
log_error() { echo -e "${RED}[setup]${NC} $1"; }

# Detect OS and package manager
detect_os() {
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        OS=$ID
        OS_LIKE=$ID_LIKE
    elif [ -f /etc/arch-release ]; then
        OS="arch"
    elif [ -f /etc/debian_version ]; then
        OS="debian"
    elif [ -f /etc/redhat-release ]; then
        OS="rhel"
    else
        OS="unknown"
    fi
    
    log_info "Detected OS: $OS"
}

# Install system packages
install_system_deps() {
    log_info "Installing system dependencies..."
    
    case "$OS" in
        ubuntu|debian|pop)
            sudo apt-get update
            sudo apt-get install -y \
                tmux \
                git \
                curl \
                wget \
                build-essential \
                ca-certificates
            ;;
        arch|manjaro|endeavouros)
            sudo pacman -Syu --noconfirm
            sudo pacman -S --noconfirm --needed \
                tmux \
                git \
                curl \
                wget \
                base-devel
            ;;
        fedora)
            sudo dnf install -y \
                tmux \
                git \
                curl \
                wget \
                gcc \
                gcc-c++ \
                make
            ;;
        centos|rhel|rocky|almalinux)
            sudo yum install -y epel-release || true
            sudo yum install -y \
                tmux \
                git \
                curl \
                wget \
                gcc \
                gcc-c++ \
                make
            ;;
        *)
            log_error "Unsupported OS: $OS"
            log_warn "Please install manually: tmux, git, curl, wget"
            return 1
            ;;
    esac
    
    log_success "System dependencies installed"
}

# Install nvm and Node.js
install_node() {
    if command -v node &>/dev/null; then
        local current_version=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
        if [ "$current_version" -ge "$NODE_VERSION" ]; then
            log_success "Node.js v$(node -v) already installed"
            return 0
        fi
    fi
    
    log_info "Installing Node.js v${NODE_VERSION} via nvm..."
    
    # Install nvm
    if [ ! -d "$HOME/.nvm" ]; then
        curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
    fi
    
    # Load nvm
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    
    # Install and use Node.js
    nvm install "$NODE_VERSION"
    nvm use "$NODE_VERSION"
    nvm alias default "$NODE_VERSION"
    
    log_success "Node.js $(node -v) installed"
}

# Install pnpm
install_pnpm() {
    if command -v pnpm &>/dev/null; then
        log_success "pnpm $(pnpm -v) already installed"
        return 0
    fi
    
    log_info "Installing pnpm..."
    
    # Load nvm if needed
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    
    npm install -g pnpm
    
    log_success "pnpm $(pnpm -v) installed"
}

# Install Node.js dependencies
install_node_deps() {
    if [ ! -f "$PROJECT_ROOT/package.json" ]; then
        log_warn "package.json not found, skipping Node.js dependencies"
        return 0
    fi
    
    log_info "Installing Node.js dependencies..."
    
    # Load nvm
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    
    cd "$PROJECT_ROOT"
    pnpm install
    
    log_success "Node.js dependencies installed"
}

# Verify installation
verify_installation() {
    log_info "Verifying installation..."
    
    local errors=0
    
    # Check tmux
    if command -v tmux &>/dev/null; then
        log_success "✓ tmux $(tmux -V)"
    else
        log_error "✗ tmux not found"
        ((errors++))
    fi
    
    # Check Node.js
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    
    if command -v node &>/dev/null; then
        log_success "✓ Node.js $(node -v)"
    else
        log_error "✗ Node.js not found"
        ((errors++))
    fi
    
    # Check pnpm
    if command -v pnpm &>/dev/null; then
        log_success "✓ pnpm $(pnpm -v)"
    else
        log_error "✗ pnpm not found"
        ((errors++))
    fi
    
    echo ""
    if [ $errors -eq 0 ]; then
        log_success "All checks passed!"
        return 0
    else
        log_error "$errors check(s) failed"
        return 1
    fi
}

# Print next steps
print_next_steps() {
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    log_success "Setup complete!"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "Next steps:"
    echo ""
    echo "  1. Configure environment variables in .env"
    echo ""
    echo "  2. Start development server:"
    echo "     pnpm dev"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

# Main
main() {
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "  military.contractors VPS Setup"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    
    detect_os
    install_system_deps
    install_node
    install_pnpm
    install_node_deps
    verify_installation
    print_next_steps
}

# Run main function
main "$@"
