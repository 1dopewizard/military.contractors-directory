#!/bin/bash

###############################################################################
# Sync Backups Script
# 
# This script synchronizes the main military.contractors project to backup directories
# Usage: ./scripts/sync-backups.sh
# 
# Backup directories:
# - military.contractors-copy: Full backup copy (keeps .git and .localdata)
###############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Project paths
SOURCE_DIR="/home/aeo/Development/Projects/military.contractors-directory/"
BACKUP_DIR="/home/aeo/Development/Projects/military.contractors-directory/copy"

# Function to print colored messages
print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

print_success() {
    echo -e "${GREEN}✔${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✖${NC} $1"
}

# Function to sync full backup (keeps .git and .localdata)
sync_full_backup() {
    local source="$1"
    local dest="$2"
    
    print_info "Syncing full backup to military.contractors-directory-copy..."
    print_info "Keeping: .git, .localdata (for disaster recovery)"
    
    # Remove old backup if it exists
    if [ -d "$dest" ]; then
        rm -rf "$dest"
    fi
    
    # Copy everything
    cp -r "$source" "$dest"
    
    # Only remove build artifacts and dependencies (can be regenerated)
    rm -rf "$dest/node_modules" 2>/dev/null || true
    rm -rf "$dest/.nuxt" 2>/dev/null || true
    rm -rf "$dest/.output" 2>/dev/null || true
    rm -rf "$dest/dist" 2>/dev/null || true
    rm -rf "$dest/coverage" 2>/dev/null || true
    rm -rf "$dest/.cache" 2>/dev/null || true
    
    # Remove log files
    find "$dest" -name "*.log" -type f -delete 2>/dev/null || true
    find "$dest" -name ".DS_Store" -type f -delete 2>/dev/null || true
    
    print_success "Successfully synced full backup"
    print_info "✓ Kept: .git (commit history), .localdata (your data), .env files"
}

# Check if source directory exists
if [ ! -d "$SOURCE_DIR" ]; then
    print_error "Source directory does not exist: $SOURCE_DIR"
    exit 1
fi

print_info "Starting backup sync process..."
echo ""

# Sync full backup (keeps .git and .localdata)
sync_full_backup "$SOURCE_DIR" "$BACKUP_DIR"

echo ""
print_success "Backup synchronized successfully!"
echo ""
print_info "Summary:"
print_info "• military.contractors-directory-copy: Full backup with .git & .localdata"
