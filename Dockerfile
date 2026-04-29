# syntax=docker/dockerfile:1.7

# ============================================================
# Stage 1 — Build
# ============================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Native deps (bcrypt) need build tools on Alpine
RUN apk add --no-cache python3 make g++

# Install all deps (including dev) for the build
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci

# Copy source and compile TypeScript -> dist/
COPY tsconfig*.json nest-cli.json ./
COPY src ./src

RUN npm run build

# Drop devDependencies after build so the prod stage can copy a lean tree
RUN npm prune --omit=dev

# ============================================================
# Stage 2 — Production runtime
# ============================================================
FROM node:20-alpine AS production

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# su-exec lets the entrypoint chown mounted volumes as root then drop to
# the unprivileged nestjs user. apk's `--no-cache` keeps the layer slim.
RUN apk add --no-cache su-exec

# Run as non-root (entrypoint drops to this user via su-exec)
RUN addgroup -g 1001 -S nodejs \
 && adduser  -S -u 1001 -G nodejs nestjs

COPY --from=builder --chown=nestjs:nodejs /app/dist          ./dist
COPY --from=builder --chown=nestjs:nodejs /app/node_modules  ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/package.json  ./package.json
COPY --from=builder --chown=nestjs:nodejs /app/prisma        ./prisma

# Pre-create the uploads dir so Docker named-volume init copies these
# permissions on first mount (defence-in-depth alongside the entrypoint).
RUN mkdir -p /app/uploads && chown -R nestjs:nodejs /app/uploads

COPY --chmod=0755 docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["node", "dist/main"]
