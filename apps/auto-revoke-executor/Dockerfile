# syntax=docker/dockerfile:1.7

FROM node:22-slim

# The slim image has no OS certificate store (Node ships its own), but native binaries such as the HyperSync client
# read the OS store. The executor does not call HyperSync today, but it is in the image, so keep this in line with the indexer.
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates && rm -rf /var/lib/apt/lists/*

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

# Write a minimal .yarnrc.yml for this build, locking down all scripts
RUN printf 'enableScripts: false\nnodeLinker: node-modules\n' > .yarnrc.yml

RUN yarn workspaces focus @revoke.cash/auto-revoke-executor --production

# Source last — changes here don't invalidate the install layer.
COPY . .

WORKDIR /app/apps/auto-revoke-executor

CMD ["node", "--require", "@swc-node/register", "src/main.ts"]
