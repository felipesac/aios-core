# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY tsconfig.json ./
COPY src/ src/

RUN npm run build

# Stage 2: Production
FROM node:20-alpine

LABEL org.opencontainers.image.title="finhealth-squad" \
      org.opencontainers.image.description="FinHealth Squad — AI-powered healthcare billing, auditing, reconciliation & cash flow" \
      org.opencontainers.image.version="1.0.0"

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=builder /app/dist/ dist/
COPY data/ data/
COPY workflows/ workflows/

USER node

ENTRYPOINT ["node", "dist/src/entry.js"]
