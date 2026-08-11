# syntax=docker/dockerfile:1
#
# portfolio (Next.js) image — portfolio.md §5: "one Dockerfile, two jobs".
#
# For now only the `dev` target exists — it backs .devcontainer/devcontainer.json
# ("build.dockerfile: ../Dockerfile", "build.target: dev"). The production
# stages (deps -> build -> runtime) get added in the Days 1-2 infra phase, once
# package.json and the app source exist. Sketch of what lands here later:
#
#   FROM node:24-trixie-slim AS deps      # npm ci --omit=dev workspace deps
#   FROM node:24-trixie-slim AS build     # copy source + deps, `next build`
#   FROM node:24-trixie-slim AS runtime   # standalone output, non-root, PORT 3000
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
