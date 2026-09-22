# syntax=docker/dockerfile:1

# ---------- dependencies ----------
FROM node:22-alpine AS deps
WORKDIR /app
# Separate layer so source edits do not re-run the install.
COPY package.json package-lock.json* ./
RUN npm ci --no-audit --no-fund

# ---------- build ----------
FROM deps AS build
WORKDIR /app
COPY . .
RUN npm run build

# ---------- serve ----------
# Only the built bundle and a dependency-free static server: no build toolchain,
# no node_modules, nothing to serve but dist/.
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production PORT=8080 STATIC_ROOT=/app/dist

COPY --from=build /app/dist ./dist
COPY server.mjs ./

EXPOSE 8080
USER node

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8080/ >/dev/null 2>&1 || exit 1

CMD ["node", "server.mjs"]
