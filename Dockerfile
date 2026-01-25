# =============================================================================
# Dockerfile for military.contractors (Nuxt SSR)
# =============================================================================
# Multi-stage build for optimal image size
#
# Build args (set in Coolify):
#   - SUPABASE_URL
#   - SUPABASE_KEY
#   - NUXT_PUBLIC_SITE_URL
#   - NUXT_PUBLIC_PYTHON_API_URL
#
# Runtime env vars (set in Coolify):
#   - SUPABASE_URL
#   - SUPABASE_KEY  
#   - NUXT_OPENAI_API_KEY
#   - RESEND_API_KEY
#   - PYTHON_API_URL
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1: Dependencies
# -----------------------------------------------------------------------------
FROM node:20-alpine AS deps

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy workspace root files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy package.json for all workspace packages
COPY apps/contractors/package.json ./apps/contractors/
COPY packages/ ./packages/

# Install dependencies
RUN pnpm install --frozen-lockfile

# -----------------------------------------------------------------------------
# Stage 2: Builder
# -----------------------------------------------------------------------------
FROM node:20-alpine AS builder

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/contractors/node_modules ./apps/contractors/node_modules
COPY --from=deps /app/packages ./packages

# Copy source code
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/contractors ./apps/contractors

# Build arguments needed at build time
ARG SUPABASE_URL
ARG SUPABASE_KEY
ARG NUXT_PUBLIC_SITE_URL=https://military.contractors
ARG NUXT_PUBLIC_PYTHON_API_URL=https://api.military.contractors
ARG NUXT_PUBLIC_DIRECTORY_URL=https://mos.directory

# Set environment variables for build
ENV SUPABASE_URL=$SUPABASE_URL
ENV SUPABASE_KEY=$SUPABASE_KEY
ENV NUXT_PUBLIC_SITE_URL=$NUXT_PUBLIC_SITE_URL
ENV NUXT_PUBLIC_PYTHON_API_URL=$NUXT_PUBLIC_PYTHON_API_URL
ENV NUXT_PUBLIC_DIRECTORY_URL=$NUXT_PUBLIC_DIRECTORY_URL

# Build the application
WORKDIR /app/apps/contractors
RUN pnpm build

# -----------------------------------------------------------------------------
# Stage 3: Production Runner
# -----------------------------------------------------------------------------
FROM node:20-alpine AS runner

RUN corepack enable && corepack prepare pnpm@latest --activate

# Create non-root user for security
RUN addgroup --system --gid 1001 nuxt && \
    adduser --system --uid 1001 nuxt

WORKDIR /app

# Copy built application
COPY --from=builder --chown=nuxt:nuxt /app/apps/contractors/.output ./.output

# Switch to non-root user
USER nuxt

# Expose port
EXPOSE 3000

# Set runtime environment
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

# Start the application
CMD ["node", ".output/server/index.mjs"]

