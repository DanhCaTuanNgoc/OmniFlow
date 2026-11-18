# Multi-Stage Dockerfile for OmniFlow Next.js Frontend
FROM node:20-alpine AS builder

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY frontend/package.json ./frontend/
COPY packages/shared/package.json ./packages/shared/

RUN pnpm install --frozen-lockfile --filter frontend... --filter @omniflow/shared...

COPY packages/shared ./packages/shared
COPY frontend ./frontend

RUN pnpm --filter @omniflow/shared build
RUN pnpm --filter frontend build

FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY --from=builder /app/frontend/.next ./frontend/.next
COPY --from=builder /app/frontend/public ./frontend/public
COPY --from=builder /app/frontend/package.json ./frontend/package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/frontend/node_modules ./frontend/node_modules

WORKDIR /app/frontend

EXPOSE 3000

CMD ["pnpm", "start"]
