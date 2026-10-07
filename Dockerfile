# ashabajasper.dev, production image (multi-stage, Next.js standalone output).
# One image serves the portfolio, the blog and the admin, told apart by Host.
# Runs as non-root on port 3000.
#
# Final targets:
#   runner (default)  the slim app image: the standalone server, static assets,
#                     content/ and assets/fonts/. No src/, no dev dependencies.
#   tools             full source plus dev dependencies, for one-off commands:
#                     `npx prisma migrate deploy`, `npx tsx scripts/*.ts`.
#                     docker-compose.coolify.yml runs migrations from it.

FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# Dependencies
FROM base AS deps
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci

# Source: everything, with the Prisma client generated
FROM base AS source
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate

# Tools: one-off commands (migrate, scripts). Never started as a long-running service.
FROM source AS tools
ENV NEXT_TELEMETRY_DISABLED=1
RUN mkdir -p /home/node/.npm && chown -R node:node /home/node
USER node
CMD ["node", "-e", "console.log('One-off commands only, for example: npx prisma migrate deploy')"]

# Build
FROM source AS builder
# Umami values are written into the HTML, so they must exist at build time.
# Empty is allowed: the analytics script is then simply not rendered.
ARG NEXT_PUBLIC_UMAMI_SCRIPT_URL=""
ARG NEXT_PUBLIC_UMAMI_WEBSITE_ID=""
ENV NEXT_PUBLIC_UMAMI_SCRIPT_URL=$NEXT_PUBLIC_UMAMI_SCRIPT_URL
ENV NEXT_PUBLIC_UMAMI_WEBSITE_ID=$NEXT_PUBLIC_UMAMI_WEBSITE_ID
# Dummy values so `next build` can evaluate config; real secrets come at runtime only.
ENV DATABASE_URL="postgresql://build:build@localhost:5432/build"
ENV AUTH_SECRET="build-time-placeholder"
ENV AUTH_TRUST_HOST="true"
# Static pages, sitemaps and feeds bake absolute URLs from this at build time.
ENV ROOT_DOMAIN="ashabajasper.dev"
ENV NEXT_TELEMETRY_DISABLED=1
# prebuild runs scripts/check-content.ts, so an invalid post fails the build.
RUN npm run build

# Runtime
FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
# Prisma client and query engine (the musl engine is listed in schema.prisma binaryTargets).
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/prisma ./prisma
# Read with fs at runtime: MDX posts, and the fonts used to render Open Graph images.
COPY --from=builder /app/content ./content
COPY --from=builder /app/assets/fonts ./assets/fonts

USER nextjs
EXPOSE 3000

CMD ["node", "server.js"]
