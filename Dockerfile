# syntax = docker/dockerfile:1

# hap-multiplayer, Node/ws/http port of the retired Cloudflare Workers
# prototype (see PROCESS.md). Serves HTTP + WebSocket on 0.0.0.0:$PORT
# (fly.toml sets PORT) via src/server.ts, and publishes README.md verbatim
# (rendered) at /readme/ -- see spec/README.md for what's checked.
#
# node:24-alpine matches mise.toml's node version. Node runs the .ts files
# directly (type-stripping, no separate build step) -- see tsconfig.json's
# note on allowImportingTsExtensions.

FROM node:24-alpine

WORKDIR /app

# Only the manifests first, so dependency install is cached across rebuilds
# that only touch source.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN corepack enable && corepack prepare pnpm@11.9.0 --activate \
    && pnpm install --prod --frozen-lockfile

COPY src ./src
COPY public ./public
COPY README.md ./README.md

ENV NODE_ENV=production
EXPOSE 8080
CMD ["node", "src/server.ts"]
