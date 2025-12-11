# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci

# Stage 2: Prisma Setup
FROM node:20-alpine AS prisma
WORKDIR /app

# Copy package files and prisma schema
COPY package.json package-lock.json* ./
COPY prisma ./prisma

# Install dependencies (only what's needed for Prisma)
RUN npm ci

# Generate Prisma Client
RUN npx prisma generate

# Stage 3: Builder
FROM node:20-alpine AS builder
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=prisma /app/node_modules/.prisma ./node_modules/.prisma

# Copy application files
COPY . .

# Copy Prisma Client from prisma stage
COPY --from=prisma /app/node_modules/.prisma ./node_modules/.prisma

# Set environment variables for build
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
# Dummy values for build-time (will be overridden at runtime)
ENV JWT_SECRET=build-time-dummy-secret-change-in-production
ENV RESPONSE_ENC_SECRET=build-time-dummy-secret-change-in-production

# Build the application
RUN npm run build

# Stage 4: Runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create a non-root user first
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Don't install Prisma globally - we'll use npx with cache directory
# This avoids permission issues with global installations

# Copy necessary files from builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Copy Prisma files and generated client
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Copy Prisma CLI package for npx to work
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma

# Copy package.json and package-lock.json for npx to work
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/package-lock.json* ./package-lock.json

# Copy startup script
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

# Create uploads directory
RUN mkdir -p uploads && chown -R nextjs:nodejs uploads

# Set ownership
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Start the application using entrypoint script
ENTRYPOINT ["./docker-entrypoint.sh"]

