# ==========================================
# Stage 1: Install dependencies
# ==========================================
FROM node:22.23.3-bookworm-slim AS deps

WORKDIR /app/apps/admin

# Local packages required by npm
COPY packages/api-contract /app/packages/api-contract
COPY packages/admin-workspace-ui /app/packages/admin-workspace-ui

# Application dependencies
COPY apps/admin/package*.json ./

RUN npm config set fetch-retries 5 \
 && npm config set fetch-retry-mintimeout 20000 \
 && npm config set fetch-retry-maxtimeout 120000

RUN npm ci --no-audit --no-fund


# ==========================================
# Stage 2: Build React/Vite application
# ==========================================
FROM node:22.23.3-bookworm-slim AS build

WORKDIR /app/apps/admin

ARG VITE_API_URL=https://api.sultano.ir
ENV VITE_API_URL=${VITE_API_URL}

# Installed dependencies
COPY --from=deps /app/apps/admin/node_modules ./node_modules

# Shared packages
COPY packages/api-contract /app/packages/api-contract
COPY packages/admin-workspace-ui /app/packages/admin-workspace-ui

# Application source code
COPY apps/admin ./

# Compile TypeScript and build Vite
RUN npm run build


# ==========================================
# Stage 3: Production Nginx
# ==========================================
FROM nginx:1.30.5-alpine AS runtime
ARG RELEASE_SHA=development
LABEL org.opencontainers.image.revision=$RELEASE_SHA
LABEL org.opencontainers.image.source=https://github.com/Mobin-Karam/bastak-school
LABEL org.opencontainers.image.title="Bastak School Web"
LABEL org.opencontainers.image.description="Bastak School Admin and Student portal"

COPY apps/admin/nginx.conf.template /etc/nginx/templates/default.conf.template

COPY --from=build /app/apps/admin/dist /usr/share/nginx/html

ENV API_PROXY_TARGET=http://backend-v2:4000

EXPOSE 80

CMD ["/bin/sh", "-c", "envsubst '$API_PROXY_TARGET' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]
