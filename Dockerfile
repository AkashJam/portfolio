# syntax=docker/dockerfile:1
#
# portfolio (Next.js) image — portfolio.md §5: "one Dockerfile, two jobs".
#
# `dev` backs .devcontainer/devcontainer.json ("build.target: dev").
# `deps` -> `build` -> `runtime` is what docker-compose.yml / CI build and
# push to ECR (`docker build --target runtime`).
#
# Base: official Node 24 (current Active LTS) on Debian trixie (Debian 13, current
# stable). Debian over Alpine because Next.js native deps (SWC, sharp) are
# glibc-based; -slim keeps the layer small.

FROM node:24-trixie-slim AS dev

ENV NODE_ENV=development

RUN apt-get update \
 && apt-get install -y --no-install-recommends \
      git \
      make \
      ca-certificates \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /workspace

# Next.js dev server
EXPOSE 3000

# The devcontainer keeps the container alive and drives it interactively;
# `make dev` / `npm run dev` are run from inside once the app exists.
CMD ["sleep", "infinity"]

# --- deps: full install (build needs devDependencies too — tsc, tailwind) --

FROM node:24-trixie-slim AS deps

WORKDIR /workspace

COPY package.json package-lock.json ./
RUN npm ci

# --- build: `next build` with output: "standalone" (next.config.ts) --------

FROM node:24-trixie-slim AS build

ENV NODE_ENV=production
WORKDIR /workspace

COPY --from=deps /workspace/node_modules ./node_modules
COPY . .
RUN npm run build

# --- runtime: standalone output only, non-root, PORT 3000 ------------------

FROM node:24-trixie-slim AS runtime

ENV NODE_ENV=production
ENV PORT=3000
# Without this, the standalone server.js resolves the container's own
# hostname to its bridge IP instead of binding all interfaces — connection
# refused on 127.0.0.1 and on any published port, even though the process
# is running (confirmed by hitting this while testing the image locally).
ENV HOSTNAME=0.0.0.0
WORKDIR /workspace

RUN groupadd --system --gid 1001 nodejs \
 && useradd --system --uid 1001 --gid nodejs nextjs

COPY --from=build --chown=nextjs:nodejs /workspace/public ./public
COPY --from=build --chown=nextjs:nodejs /workspace/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /workspace/.next/static ./.next/static

USER nextjs
EXPOSE 3000

CMD ["node", "server.js"]
