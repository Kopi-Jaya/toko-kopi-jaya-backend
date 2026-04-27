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

# Run as non-root
RUN addgroup -g 1001 -S nodejs \
 && adduser  -S -u 1001 -G nodejs nestjs

COPY --from=builder --chown=nestjs:nodejs /app/dist          ./dist
COPY --from=builder --chown=nestjs:nodejs /app/node_modules  ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/package.json  ./package.json
COPY --from=builder --chown=nestjs:nodejs /app/prisma        ./prisma

USER nestjs

EXPOSE 3000

CMD ["node", "dist/main"]
