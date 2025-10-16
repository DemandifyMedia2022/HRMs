## Quick orientation for AI coding agents

This is a Next.js (App Router) HRMS project with a small backend surface implemented as Next.js API routes and Prisma for database access. The goal: be conservative, reference existing files, and make minimal, focused edits unless asked otherwise.

Key facts you'll need immediately:

- Framework: Next.js (app/ directory). Entry layout: `src/app/layout.tsx` and route handlers under `src/app/api/**`.
- DB: Prisma + MySQL. Schema: `prisma/schema.prisma`. Prisma client singleton: `src/lib/prisma.ts`.
- Auth: JWT cookie-based auth. Helpers in `src/lib/auth.ts`. Cookie name: `access_token`. Token creation/verification used across `src/app/api/auth/*` and middleware in `src/lib/middleware.ts`.
- Important API examples:
  - Login: `src/app/api/auth/login/route.ts` — validates password (bcrypt), normalizes `$2y$` → `$2a$` hashes, sets `access_token` cookie.
  - Whoami: `src/app/api/auth/me/route.ts` — reads cookie and returns user info.
  - Attendance sync / ESSL integration: `src/app/api/essl/sync/route.ts` and `src/app/api/attendance/sync/route.ts` — supports SOAP XML (ESSL device) and JSON URL ingest; stores into `npAttendance` (`npattendance`) table.

Conventions and patterns to follow when changing code:

- Use the existing path alias `@/*` (see `tsconfig.json`) when referencing project files (e.g. `@/lib/prisma`).
- Server vs client: App Router defaults to server components — add `"use client"` at top of React components that need client behavior (home page is a client component: `src/app/page.tsx`).
- Prisma BigInt handling: `users.id` is `BigInt` in the schema—code converts to Number with a `typeof user.id === 'bigint'` guard; replicate this pattern when reading `users.id`.
- Cookie & auth behavior: login sets `access_token` httpOnly cookie for 1 hour. Many API routes and middleware expect that cookie. Preserve cookie name and options unless updating auth intentionally.
- Date handling: attendance sync enforces data >= 2025-01-01 in code. The ESSL SOAP parser uses a 7AM cycle boundary (see helpers in `src/app/api/essl/sync/route.ts`) — avoid changing that logic unless required.

Developer workflows (how to run and test locally):

- Start dev server: `npm run dev` (script uses `next dev --turbopack`).
- Build: `npm run build` (`next build --turbopack`).
- Lint: `npm run lint` (calls `eslint`).
- Prisma tasks (DB is MySQL per schema):
  - Generate client: `npx prisma generate`
  - Run migrations / dev DB: `npx prisma migrate dev --name <name>`
  - Inspect data: `npx prisma studio`

Files to inspect for common tasks:

- Layout and global styles: `src/app/layout.tsx`, `src/app/globals.css`.
- Shared libs: `src/lib/auth.ts`, `src/lib/prisma.ts`, `src/lib/middleware.ts`, `src/lib/utils.ts`.
- UI primitives are under: `src/app/components/ui/*` (reuse rather than inventing new variants).

Integration & external dependencies to be careful with:

- Environment variables: `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, and ESSL-specific variables: `ESSL_SERVER_URL`, `ESSL_SERIAL_NUMBER`, `ESSL_USERNAME`, `ESSL_PASSWORD`. Missing `JWT_SECRET` will throw (see `src/lib/auth.ts`).
- External network calls: ESSL sync uses `axios` to call a SOAP endpoint. When editing, ensure error handling and response-type checks remain (code expects XML and falls back to JSON mode when a `url` is provided).

Small code examples (follow these patterns):

- Read user from cookie in an API route:
  - Use `req.cookies.get('access_token')?.value` then `verifyToken(token)` from `@/lib/auth` (see `src/app/api/auth/me/route.ts`).
- Query Prisma client:
  - Import `prisma` from `@/lib/prisma` and use methods like `prisma.npAttendance.findFirst(...)` (see `src/app/api/essl/sync/route.ts`).

When making changes, run these quick checks before committing:

- `npm run lint` — fix ESLint errors.
- Start dev server (`npm run dev`) and exercise the relevant API endpoints (e.g. `/api/auth/login`, `/api/essl/sync`). Note: `GET /api/essl/sync` proxies to the POST handler for quick local testing.

If anything is unclear or you need deeper context (e.g., DB seed, environment secrets, or CI), ask the maintainers for the `.env` values and migration history before changing data-affecting code.

---
If you want, I can iterate on this file to add brief examples for common PR types (bugfix, backend schema change, frontend layout change). Tell me which category to expand.
