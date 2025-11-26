FROM node:20-alpine AS base

ENV DATABASE_URL='mysql://root:@host.docker.internal:3306/hrms_db' \
    ESSL_SERVER_URL='http://192.168.0.3/webapiservice.asmx?op=GetTransactionsLog' \
    ESSL_SERIAL_NUMBER='BJ2C211860737' \
    ESSL_USERNAME='essl1' \
    ESSL_PASSWORD='Essl@123' \
    JWT_SECRET='Speed@2025' \
    JWT_EXPIRES_IN='1h' \
    MAIL_MAILER='smtp' \
    MAIL_HOST='smtppro.zoho.in' \
    MAIL_PORT='465' \
    MAIL_USERNAME='support@hariteq.com' \
    MAIL_PASSWORD='Supp0rt@202$' \
    MAIL_ENCRYPTION='ssl' \
    MAIL_FROM_ADDRESS='support@hariteq.com' \
    MAIL_FROM_NAME='HRMS' \
    NEXT_PUBLIC_BASE_URL='http://localhost:3000' \
    ESSL_SYNC_URL='http://localhost:3000/api/essl/sync' \
    ESSL_SYNC_TIMEOUT_MS='6000' \
    RESPONSE_ENC_SECRET='Speed@2025' \
    OPENAI_API_KEY='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' \
    ESSL_LOOKBACK_DAYS='0' \
    ESSL_OVERWRITE_SHIFT='0'

# Install dependencies only when needed
FROM base AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
# Uncomment the following line in case you want to disable telemetry during the build.
# ENV NEXT_TELEMETRY_DISABLED 1

RUN npx prisma generate
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
# Uncomment the following line in case you want to disable telemetry during runtime.
# ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.env ./

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
