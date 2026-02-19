# Install ALL deps (termasuk typescript) untuk build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci  # BUKAN --only=production!
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Production (copy built app)
FROM node:20-alpine AS runner
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy ONLY production files
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs
ENV NODE_ENV=production
ENV PORT=3112
ENV HOSTNAME=0.0.0.0

EXPOSE 3112

# Standalone CMD (fix next start error)
CMD ["node", "server.js"]
