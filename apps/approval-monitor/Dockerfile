# syntax=docker/dockerfile:1.7

FROM node:22-slim

RUN corepack enable
WORKDIR /app

ENV NODE_ENV=production
ENV NEON_USE_WEBSOCKET=true

# Workspace config + manifests — minimum needed for `yarn install` to resolve.
COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn ./.yarn
COPY apps/approval-monitor/package.json ./apps/approval-monitor/
COPY apps/web/package.json ./apps/web/
COPY packages/core/package.json ./packages/core/

# Production deps only — @swc-node/register and @swc/core are runtime deps so they land here.
RUN yarn workspaces focus @revoke.cash/approval-monitor --production

# Source last — changes here don't invalidate the install layer.
COPY . .

WORKDIR /app/apps/approval-monitor

# Role chosen at deploy time via `IS_MANAGER` env var (read by ConfigService).
CMD ["node", "--require", "@swc-node/register", "src/main.ts"]
