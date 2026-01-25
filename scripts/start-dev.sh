#!/bin/bash

# =============================================================================
# military.contractors Development Start Script
# =============================================================================

if [ "$1" = "--stop" ]; then
    pkill -f "nuxt dev" || true
    exit 0
fi

pnpm dev
