# syntax=docker/dockerfile:1
<<<<<<< before updating
# Shared multi-stage Dockerfile for Next.js standalone apps in monorepos.
#
# - Build starts from the repo root, or from the pruned context of
#   `turbo prune <app> --docker`: its `full` directory, laid out the same once
#   the pruned pnpm-lock.yaml and the root .dockerignore are copied in and an
#   empty packages/ exists for an app that uses none. The app folder is
#   selected via build arg.
# - The base image is pinned by digest, so that the same inputs give the same
#   image; the update bot moves tag and digest together.
# - BUILD_HASH, when given, becomes Next's build ID (next.config.ts), and the
#   secret next-server-actions-encryption-key fixes the key Next would
#   otherwise draw at random; without them a build is as random as before.
#
# Usage, invoked from repo root:
#   docker build --build-arg APP=website --platform linux/arm64 -t acme/website .
#
# ── BUILD ─────────────────────────────────────────────────────────────────
FROM node:24-slim@sha256:dc26ae92c9fb15cf6b1d63e20f0944b2efe0f115b20e00be48fb23fceb061c54 AS builder
||||||| last update
# Shared multi-stage Dockerfile for Next.js standalone apps in monorepos.
#
# - Build starts from the repo root, or from the pruned context of
#   `turbo prune <app> --docker`: its `full` directory, laid out the same once
#   the pruned pnpm-lock.yaml and the root .dockerignore are copied in and an
#   empty packages/ exists for an app that uses none. The app folder is
#   selected via build arg.
# - The base image is pinned by digest, so that the same inputs give the same
#   image; the update bot moves tag and digest together.
# - BUILD_HASH, when given, becomes Next's build ID (next.config.ts), and the
#   secret next-server-actions-encryption-key fixes the key Next would
#   otherwise draw at random; without them a build is as random as before.
#
# Usage, invoked from repo root:
#   docker build --build-arg APP=website --platform linux/arm64 -t acme/website .
#
# ── BUILD ─────────────────────────────────────────────────────────────────
FROM node:24-slim@sha256:c86ecead9e55a5210ac1727de38a4ca840bf03dcaf34dc9749addbf383b1920c AS builder
=======
# Generated from plexus-ms/template-app-nextjs.
# The image build of a Next.js standalone app in the monorepo, from its root or a pruned context (PLX-App/Dockerfile).
FROM node:24-slim@sha256:c86ecead9e55a5210ac1727de38a4ca840bf03dcaf34dc9749addbf383b1920c AS builder
>>>>>>> after updating
ARG APP
WORKDIR /repo
ENV CI=1
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable
# package.json comes along so that corepack runs the pnpm its packageManager pins.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm fetch
COPY turbo.json ./
COPY packages packages
COPY apps/${APP} apps/${APP}
# public/ is optional; an empty one lets the runner stage copy it unconditionally.
RUN mkdir -p apps/${APP}/public
RUN pnpm install --frozen-lockfile --prefer-offline
# pnpm, not Turbo, whose strict environment would hide BUILD_HASH and the key from `next build`;
# the filter's trailing `...` builds the app's workspace dependencies first, as `^build` would.
ARG BUILD_HASH
RUN --mount=type=secret,id=next-server-actions-encryption-key,env=NEXT_SERVER_ACTIONS_ENCRYPTION_KEY \
    BUILD_HASH=${BUILD_HASH} pnpm --filter "{./apps/${APP}}..." run build

<<<<<<< before updating
# ── RUNTIME ─────────────────────────────────────────────────────────────────
FROM node:24-slim@sha256:dc26ae92c9fb15cf6b1d63e20f0944b2efe0f115b20e00be48fb23fceb061c54 AS runner
||||||| last update
# ── RUNTIME ─────────────────────────────────────────────────────────────────
FROM node:24-slim@sha256:c86ecead9e55a5210ac1727de38a4ca840bf03dcaf34dc9749addbf383b1920c AS runner
=======
FROM node:24-slim@sha256:c86ecead9e55a5210ac1727de38a4ca840bf03dcaf34dc9749addbf383b1920c AS runner
>>>>>>> after updating
ARG APP
WORKDIR /repo
ENV NODE_ENV=production
# The standalone output keeps the monorepo's layout; the static files and public/ go in beside it.
COPY --from=builder --chown=node:node /repo/apps/${APP}/.next/standalone ./
COPY --from=builder --chown=node:node /repo/apps/${APP}/.next/static ./apps/${APP}/.next/static
COPY --from=builder --chown=node:node /repo/apps/${APP}/public ./apps/${APP}/public
WORKDIR /repo/apps/${APP}
USER node
EXPOSE 3000
ENV HOSTNAME=0.0.0.0
ENTRYPOINT ["node", "server.js"]
