FROM node:22.23.3-bookworm-slim AS deps
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ && rm -rf /var/lib/apt/lists/*
COPY packages/api-contract /app/packages/api-contract
COPY packages/cmb ./packages/cmb
COPY apps/api/package*.json ./apps/api/
WORKDIR /app/apps/api
# On the self-hosted production runner, overlayfs can briefly keep esbuild's
# postinstall binary open, causing npm's immediate validation to fail with
# ETXTBSY. A clean retry makes the dependency layer deterministic without
# masking persistent install failures.
RUN attempt=1; \
    until npm ci --no-audit --no-fund; do \
      if [ "$attempt" -ge 3 ]; then exit 1; fi; \
      attempt=$((attempt + 1)); \
      rm -rf node_modules; \
      sleep 2; \
    done

FROM deps AS prod-deps
WORKDIR /app/apps/api
RUN npm prune --omit=dev

FROM node:22.23.3-bookworm-slim AS build
WORKDIR /app/apps/api
COPY --from=deps /app/apps/api/node_modules ./node_modules
COPY packages/api-contract /app/packages/api-contract
COPY packages/cmb /app/packages/cmb
COPY apps/api .
RUN npm run build

FROM node:22.23.3-bookworm-slim AS runtime
ARG RELEASE_SHA=development
LABEL org.opencontainers.image.revision=$RELEASE_SHA
LABEL org.opencontainers.image.source=https://github.com/Mobin-Karam/bastak-school
LABEL org.opencontainers.image.title="Bastak School API"
LABEL org.opencontainers.image.description="Bastak School private API service"
WORKDIR /app/apps/api
ENV NODE_ENV=production
ENV NODE_PATH=/app/apps/api/node_modules
RUN mkdir -p /data && chown node:node /data
COPY --from=prod-deps /app/apps/api/node_modules ./node_modules
COPY packages/api-contract /app/packages/api-contract
COPY packages/cmb /app/packages/cmb
COPY apps/api/package*.json ./
COPY --from=build /app/apps/api/dist ./dist
USER node
EXPOSE 4000
CMD ["node", "dist/main.js"]
