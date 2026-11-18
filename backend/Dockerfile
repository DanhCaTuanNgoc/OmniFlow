# Multi-Stage Dockerfile for OmniFlow Backend Service (Railway Production)
# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy workspace configuration and dependency manifests
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY backend/package.json ./backend/
COPY packages/shared/package.json ./packages/shared/

# Install dependencies across workspace
RUN pnpm install --frozen-lockfile --filter backend... --filter @omniflow/shared...

# Copy source code
COPY packages/shared ./packages/shared
COPY backend ./backend

# Build shared library and backend TypeScript
RUN pnpm --filter @omniflow/shared build
RUN pnpm --filter backend build

# Stage 2: Production Runner
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy manifests
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY backend/package.json ./backend/
COPY packages/shared/package.json ./packages/shared/

# Install production dependencies only
RUN pnpm install --prod --frozen-lockfile --filter backend... --filter @omniflow/shared...

# Copy compiled artifacts from builder stage
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/backend/dist ./backend/dist

WORKDIR /app/backend

EXPOSE 8080

# Health check probe against /health endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

CMD ["node", "dist/index.js"]
