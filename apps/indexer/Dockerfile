# syntax=docker/dockerfile:1.7

FROM node:22-slim

RUN corepack enable
WORKDIR /app

ENV NODE_ENV=production
ENV NEON_USE_WEBSOCKET=true

# Workspace config + all workspace manifests so Yarn can resolve the workspace graph.
COPY package.json yarn.lock ./
COPY .yarn ./.yarn
COPY apps/auto-revoke-executor/package.json ./apps/auto-revoke-executor/
COPY apps/indexer/package.json ./apps/indexer/
COPY apps/web/package.json ./apps/web/
COPY packages/backend/package.json ./packages/backend/
COPY packages/core/package.json ./packages/core/

# Write a minimal .yarnrc.yml for this build, locking down all scripts.
RUN printf 'enableScripts: false\nnodeLinker: node-modules\nyarnPath: .yarn/releases/yarn-4.15.0.cjs\n' > .yarnrc.yml

# Production deps only — @swc-node/register and @swc/core are runtime deps so they land here.
RUN yarn workspaces focus @revoke.cash/indexer --production

# Source last — changes here don't invalidate the install layer.
COPY . .

WORKDIR /app/apps/indexer

# Role chosen at deploy time via `IS_MANAGER` env var (read by ConfigService).
CMD ["node", "--require", "@swc-node/register", "src/main.ts"]
