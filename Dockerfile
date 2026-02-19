# Multi-stage build
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production --no-optional && npm cache clean --force

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Production image
FROM node:20-alpine AS runner
WORKDIR /app

# Non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy built app
COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/public ./public/
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./.next/standalone
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static/

USER nextjs

ENV NODE_ENV=production
ENV PORT=3112
ENV HOSTNAME="0.0.0.0"

EXPOSE 3112

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node_modules/.bin/next healthcheck || exit 1

# Standard next start (tanpa standalone error)
CMD ["npm", "start"]
