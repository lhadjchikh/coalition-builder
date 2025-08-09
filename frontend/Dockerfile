FROM node:22-alpine AS base

# Install dependencies only when needed
FROM base AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./
RUN \
  if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci; \
  elif [ -f pnpm-lock.yaml ]; then yarn global add pnpm && pnpm i --frozen-lockfile; \
  else echo "Lockfile not found." && exit 1; \
  fi

# Stage for development and testing
FROM base AS frontend-builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN mkdir -p ./public

# Environment variables for development/testing
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=development

# Production build stage - rebuild the source code only when needed
FROM frontend-builder AS production-builder
WORKDIR /app

# Environment variables for build time
ENV NODE_ENV=production

# Enable build caching
ARG NEXT_PUBLIC_API_URL
ARG API_URL

# Build with cache enabled
# Skip static generation during build since API is not available
ENV SKIP_STATIC_GENERATION=true
RUN --mount=type=cache,target=/app/.next/cache npm run build

# Compile TypeScript health check to JavaScript
RUN npx tsc healthcheck.ts --target es2020 --module commonjs --moduleResolution node

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

# Install utilities needed at runtime
RUN apk add --no-cache curl


ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=production-builder --chown=nextjs:nodejs /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir -p .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=production-builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=production-builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy compiled health check file
COPY --from=production-builder --chown=nextjs:nodejs /app/healthcheck.js /app/

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Health check
HEALTHCHECK --interval=30s --timeout=15s --start-period=60s --retries=3 \
  CMD node healthcheck.js

# Use Next.js standalone server
CMD ["node", "server.js"]