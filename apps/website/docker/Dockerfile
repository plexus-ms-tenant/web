# syntax=docker/dockerfile:1
# Shared multi-stage Dockerfile for Next.js standalone apps in monorepos.
#
# - Build starts from the repo root, or from the pruned context of
#   `turbo prune <app> --docker`: its `full` directory, laid out the same once
#   the pruned pnpm-lock.yaml and the root .dockerignore are copied in and an
#   empty packages/ exists for an app that uses none. The app folder is
#   selected via build arg.
# - The base image is pinned by digest, so that the same inputs give the same
#   image; the update bot moves tag and digest together. NODE_VERSION, which
#   the forge strategy's release still passes from .node-version, is accepted
#   and not used.
# - BUILD_HASH, when given, becomes Next's build ID (next.config.ts), and the
#   secret next-server-actions-encryption-key fixes the key Next would
#   otherwise draw at random; without them a build is as random as before.
#
# Usage, invoked from repo root:
#   docker build --build-arg APP=website --platform linux/arm64 -t acme/website .
#
ARG NODE_VERSION

# ── BUILD ─────────────────────────────────────────────────────────────────
FROM node:24-slim@sha256:c86ecead9e55a5210ac1727de38a4ca840bf03dcaf34dc9749addbf383b1920c AS builder
ARG APP
WORKDIR /repo
ENV CI=1
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable
# Populate virtual pnpm store (see https://pnpm.io/cli/fetch);
# package.json comes along so that corepack runs the pnpm pinned in packageManager here too
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm fetch
# Copy sources and install dependencies from the virtual store, exactly as the lockfile says
COPY turbo.json ./
COPY packages packages
COPY apps/${APP} apps/${APP}
RUN pnpm install --frozen-lockfile --prefer-offline
# Build the one app with pnpm, not through Turbo: the context may hold this
# app alone, and Turbo's strict environment would hide BUILD_HASH and the key
# from `next build`. Next's preview-mode keys cannot be fixed from outside:
# it reads them from a cache file it refuses to use inside a container, so
# they stay random, the one known difference between two builds of the same
# inputs besides what the image's own layers carry.
ARG BUILD_HASH
RUN --mount=type=secret,id=next-server-actions-encryption-key,env=NEXT_SERVER_ACTIONS_ENCRYPTION_KEY \
    BUILD_HASH=${BUILD_HASH} pnpm --filter ./apps/${APP} run build

# ── RUNTIME ─────────────────────────────────────────────────────────────────
FROM node:24-slim@sha256:c86ecead9e55a5210ac1727de38a4ca840bf03dcaf34dc9749addbf383b1920c AS runner
ARG APP
WORKDIR /repo
ENV NODE_ENV=production
# Copy output files from builder stage
# Monorepo layout is preserved under outputFileTracingRoot:
# /repo/apps/${APP}/.next/standalone/
# ├── node_modules
# └── apps
#     └── ${APP}
#         ├── .next       # while not using a separate CDN, static files need to go here
#         └── server.js
COPY --from=builder --chown=node:node /repo/apps/${APP}/.next/standalone ./
COPY --from=builder --chown=node:node /repo/apps/${APP}/.next/static ./apps/${APP}/.next/static
# Startup
WORKDIR /repo/apps/${APP}
USER node
EXPOSE 3000
ENV HOSTNAME=0.0.0.0
ENTRYPOINT ["node", "server.js"]
