# ==============================================================================
# Production Dockerfile for MedusaJS v2 Backend
# - Multi-stage build
# - Non-root execution (medusa:1001)
# - Zero secrets baked into image
# - Healthcheck on /health
# ==============================================================================

# Stage 1: Base image with system build dependencies
FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat python3 make g++ curl postgresql-client
WORKDIR /app

# Stage 2: Install dependencies and build Medusa server
FROM base AS builder
WORKDIR /app

# Copy monorepo root package manifests
COPY package.json package-lock.json ./
COPY apps/medusa/package.json ./apps/medusa/
COPY apps/web/package.json ./apps/web/

# Clean install all dependencies (including devDependencies required for medusa build)
RUN npm ci

# Copy Medusa application source code and tsconfigs
COPY apps/medusa/tsconfig.json ./apps/medusa/
COPY apps/medusa/medusa-config.ts ./apps/medusa/
COPY apps/medusa/instrumentation.ts ./apps/medusa/
COPY apps/medusa/src ./apps/medusa/src
COPY apps/medusa/public ./apps/medusa/public

# Build Medusa application (compiles TypeScript modules and embeds Medusa Admin UI)
RUN npm run build:medusa

# Prune devDependencies for a lean production runtime
RUN npm prune --production

# Stage 3: Production minimal runtime
FROM node:22-alpine AS runner
RUN apk add --no-cache curl postgresql-client dumb-init

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=9000

# Security: Create non-root system group and user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 medusa

# Copy production dependencies and built server artifacts
COPY --from=builder --chown=medusa:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=medusa:nodejs /app/package.json ./package.json
COPY --from=builder --chown=medusa:nodejs /app/apps/medusa ./apps/medusa

# Create secret mount directory with restricted permissions
RUN mkdir -p /etc/secrets && chown -R medusa:nodejs /etc/secrets

# Switch to unprivileged user
USER medusa

# Expose Medusa HTTP port
EXPOSE 9000

# Built-in Docker healthcheck against Medusa /health endpoint
HEALTHCHECK --interval=20s --timeout=5s --start-period=45s --retries=3 \
  CMD curl -f http://localhost:9000/health || exit 1

ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["npm", "run", "start:medusa"]
