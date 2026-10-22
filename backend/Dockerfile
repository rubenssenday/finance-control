# ==========================================
# 1. Base Stage
# ==========================================
FROM node:20-alpine AS base
RUN apk add --no-cache openssl libc6-compat
WORKDIR /app

# ==========================================
# 2. Dependencies Stage
# ==========================================
FROM base AS deps
COPY package*.json ./
COPY prisma ./prisma/
RUN npm install

# ==========================================
# 3. Builder Stage
# ==========================================
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build
# Prune development dependencies
RUN npm prune --production

# ==========================================
# 4. Production Runner Stage
# ==========================================
FROM base AS runner
ENV NODE_ENV=production
WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./package.json

EXPOSE 3001

# Run database migrations and start the NestJS server
CMD ["sh", "-c", "npx prisma migrate deploy && if [ -f dist/main.js ]; then node dist/main.js; else node dist/src/main.js; fi"]
