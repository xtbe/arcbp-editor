# ── Stage 1: build the Vite app ───────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ── Stage 2: serve with nginx ─────────────────────────────────────────────
FROM nginx:stable-alpine

# Custom nginx config: serves the SPA and proxies /api/* to PocketBase
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the built SPA from the builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
