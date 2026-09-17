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

# sentry-cli (a standalone binary bundled with @sentry/nextjs, not Node) uses
# the OS cert store for its own HTTPS calls to Sentry's API — Node's own
# fetch/https works fine on this base image without it, which is why nothing
# else in this stage ever needed it before. Without it: "SSL certificate
# problem: unable to get local issuer certificate", and the source-map
# upload silently fails (non-fatal to the build itself, but no source maps
# ever reach Sentry).
RUN apt-get update \
 && apt-get install -y --no-install-recommends ca-certificates \
 && rm -rf /var/lib/apt/lists/*

# Both of these are consumed by `next build` (which inlines
# NEXT_PUBLIC_SENTRY_DSN into the client bundle) and so have to reach the
# *build* step, not the running container. Neither is a secret: the DSN is
# public by design (see .env.example — it can submit events, never read Sentry
# data) and ships in the browser bundle anyway; SENTRY_RELEASE is a git SHA.
# The ENV re-declaration is belt-and-braces — an ARG is already visible to RUN
# within the stage that declares it — but it keeps the value explicit at the
# point of use.
#
# SENTRY_AUTH_TOKEN is deliberately NOT one of these. It is a real credential
# (it can read the Sentry project, not just write to it), and build args are
# recorded in image metadata and `docker history`. It arrives instead as a
# BuildKit secret mounted onto the `npm run build` RUN below, which leaves no
# trace in any layer. A build with no secret provided simply leaves it unset,
# and the plugin skips the source-map upload with a warning rather than
# failing — which is what every local and PR build does.
#
# SENTRY_RELEASE: .dockerignore excludes .git from the build context (small,
# standard practice), so the Sentry plugin's own git-based auto-detection of
# the release name finds nothing and silently uploads under the literal
# release "undefined" — breaking release/deploy tracking and suspect-commit
# correlation entirely. ci.yml passes the same git SHA already used for the
# ECR image tag, so the release name actually matches a real commit Sentry's
# connected GitHub repo can look up.
ARG NEXT_PUBLIC_SENTRY_DSN
ARG SENTRY_RELEASE
ENV NEXT_PUBLIC_SENTRY_DSN=$NEXT_PUBLIC_SENTRY_DSN
ENV SENTRY_RELEASE=$SENTRY_RELEASE

# NEXT_PUBLIC_SITE_URL: the same build-time story as the DSN above.
# infra/docker-compose.yml also sets it as a *runtime* container env var, but
# that copy arrives too late — `next build` inlines NEXT_PUBLIC_ references, so
# without this ARG lib/site.ts falls back to "http://localhost:3000" and every
# canonical URL fed from it — metadataBase, sitemap.xml, robots.txt — advertises
# localhost in production. Not a secret: it is the site's own public origin.
#
# The ARG deliberately has no default, so an unpassed build-arg reaches the app
# as an empty string rather than undefined — Next inlines any value that is not
# null. lib/site.ts uses `||` rather than `??` for exactly that reason; with
# `??` the empty string would survive and `new URL("")` would fail the build.
ARG NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL

COPY --from=deps /workspace/node_modules ./node_modules
COPY . .
RUN --mount=type=secret,id=sentry_auth,env=SENTRY_AUTH_TOKEN \
    npm run build

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
