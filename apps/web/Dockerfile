# ==============================================================================
# Production Dockerfile for Next.js 15 Storefront
# - Multi-stage build
# - Standalone output optimization for minimal image footprint
# - Non-root execution (nextjs:1001)
# - Zero secrets baked into image
# - Healthcheck on root endpoint
# ==============================================================================

# Stage 1: Base image
FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat curl
WORKDIR /app

# Stage 2: Install dependencies
FROM base AS deps
WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/medusa/package.json ./apps/medusa/
COPY apps/web/package.json ./apps/web/

RUN npm ci

# Stage 3: Build Next.js application
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json ./
COPY apps/web ./apps/web

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Public build-time arguments (client-safe only)
ARG NEXT_PUBLIC_MEDUSA_BACKEND_URL
ARG NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
ARG NEXT_PUBLIC_MEILISEARCH_URL
ARG NEXT_PUBLIC_MEILISEARCH_SEARCH_KEY
ARG NEXT_PUBLIC_META_PIXEL_ID

ENV NEXT_PUBLIC_MEDUSA_BACKEND_URL=$NEXT_PUBLIC_MEDUSA_BACKEND_URL
ENV NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=$NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
ENV NEXT_PUBLIC_MEILISEARCH_URL=$NEXT_PUBLIC_MEILISEARCH_URL
ENV NEXT_PUBLIC_MEILISEARCH_SEARCH_KEY=$NEXT_PUBLIC_MEILISEARCH_SEARCH_KEY
ENV NEXT_PUBLIC_META_PIXEL_ID=$NEXT_PUBLIC_META_PIXEL_ID

RUN npm run build:web

# Stage 4: Production lean runner
FROM node:22-alpine AS runner
RUN apk add --no-cache curl dumb-init

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV NEXT_TELEMETRY_DISABLED=1

# Security: Create unprivileged system group and user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy standalone build and static assets
COPY --from=builder /app/apps/web/next.config.mjs ./apps/web/
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static

# Ensure public folder exists if not created in builder
RUN mkdir -p apps/web/public && chown -R nextjs:nodejs apps/web/public

USER nextjs

EXPOSE 3000

# Built-in Docker healthcheck against Next.js root route (handles 200/307 redirects)
HEALTHCHECK --interval=20s --timeout=5s --start-period=30s --retries=3 \
  CMD curl -k -s -o /dev/null -w "%{http_code}" http://localhost:3000/ | grep -E '^(200|301|302|307|308)$' || exit 1

ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["node", "apps/web/server.js"]
