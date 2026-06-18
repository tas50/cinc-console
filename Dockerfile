# syntax=docker/dockerfile:1

FROM node:26-alpine AS deps
WORKDIR /app
# Node 25+ no longer bundles Corepack, so install it before enabling. Corepack
# then uses the pnpm version pinned by package.json's "packageManager" field.
RUN npm install -g corepack@latest && corepack enable
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM node:26-alpine AS build
WORKDIR /app
# Node 25+ no longer bundles Corepack, so install it before enabling. Corepack
# then uses the pnpm version pinned by package.json's "packageManager" field.
RUN npm install -g corepack@latest && corepack enable
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build

FROM node:26-alpine AS run
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0
RUN addgroup -S app && adduser -S app -G app
# Next.js standalone output: a self-contained server plus static assets.
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
USER app
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s \
  CMD wget -qO- http://127.0.0.1:3000/api/healthz || exit 1
CMD ["node", "server.js"]
