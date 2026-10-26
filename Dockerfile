# Multi-stage production Dockerfile for CodeAtlas
# Base image with official Node.js 20 LTS Alpine
FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat
ENV NODE_ENV=production

# Stage 1: Dependencies installer
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --include=dev

# Stage 2: Application builder
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Stage 3: Production runner (least-privilege non-root user)
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Create persistent data directory and assign permissions
RUN mkdir -p /app/data && chown -R nextjs:nodejs /app/data

# Copy built artifacts and necessary runtime files
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/data ./data

USER nextjs

EXPOSE 3000

# Automated container healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

CMD ["npm", "run", "start"]
