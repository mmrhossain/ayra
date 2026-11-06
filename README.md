# Ayra

Ayra is a production-oriented single-store commerce platform: a Next.js storefront
and admin dashboard backed by an Express/Prisma API.

## Features

- Storefront catalog, search, cart, checkout, and customer accounts
- Admin dashboard for products, variants, inventory, orders, returns, coupons,
  reviews, FAQs, shipping zones, media, payments, refunds, and platform settings
- COD and SSLCommerz payments with verified settlement and idempotent webhooks
- Inventory reservation with row locking, refunds, and order status history
- Better Auth email/password and optional Google sign-in

## Stack

- Client: Next.js 16, React 19, TypeScript, Tailwind CSS 4
- API: Node 22, Express 5, TypeScript, Prisma 7
- Data: PostgreSQL 16, Redis 7
- Payments: SSLCommerz (COD built in)
- Media: Cloudinary, Resend/SMTP email

## Requirements

- Node.js >= 22 and npm
- PostgreSQL >= 16
- Redis >= 7
- Docker with Compose v2 (recommended path)

## Quick start with Docker

```bash
cp server/.env.example server/.env
# edit server/.env: set BETTER_AUTH_SECRET and a strong ADMIN_PASSWORD
docker compose up -d --build
```

- Storefront: http://localhost:3000
- API: http://localhost:5000/api/v1
- API docs (non-production): http://localhost:5000/api-docs

The server container runs `prisma migrate deploy` on start. Create the first admin:

```bash
docker compose exec server npm run seed:admin
```

The Compose Postgres password (`ayra-local-only`) is for local development only.
Change it before exposing the stack to any network.

## Manual setup

```bash
npm run install:all
cp server/.env.example server/.env
cp client/.env.example client/.env
# edit both files

cd server
npx prisma migrate deploy
npm run seed:admin
npm run dev
```

In a second terminal:

```bash
cd client
npm run dev
```

## Environment

See `server/.env.example` and `client/.env.example`.

Required server values:

- `NODE_ENV`, `PORT`, `FRONTEND_URL`
- `DATABASE_URL`, `DIRECT_URL`
- `REDIS_URL` (required outside `NODE_ENV=test`)
- `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`
- `ACCESS_TOKEN_SECRET`, `ACCESS_TOKEN_EXPIRES_IN`
- `REFRESH_TOKEN_SECRET`, `REFRESH_TOKEN_EXPIRES_IN`
- `RESEND_FROM`

`ACCESS_TOKEN_*` and `REFRESH_TOKEN_*` are reserved and currently unused, but the
environment schema still requires them.

Optional: `SETTINGS_ENCRYPTION_KEY` uses a dedicated key for platform-setting
secrets. When unset, the key is derived from `BETTER_AUTH_SECRET`. Set it before
storing payment secrets; changing it makes stored secrets undecryptable.

Client values:

- `BACKEND_ORIGIN` (server-side proxy target)
- `NEXT_PUBLIC_SITE_NAME`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SUPPORT_EMAIL`
- `NEXT_PUBLIC_BETTER_AUTH_URL`, `NEXT_PUBLIC_CALLBACK_URL`

`NEXT_PUBLIC_*` values are inlined at build time. Rebuild the client after changing
them.

## Database

- `npx prisma migrate deploy` applies all migrations, including live constraints
  and trigram search indexes.
- `npm run db:constraints` and `npm run db:search-indexes` are legacy fallbacks for
  databases created before migration `20261019090000_live_constraints`.
- `npm run seed` creates demo data; `npm run seed:admin` creates the first admin.
- Seeded admins are email-verified by default. Set `ADMIN_EMAIL_VERIFIED=false` only
  when testing the verification flow.

## Payments

COD is always available. Configure SSLCommerz with `SSLCOMMERZ_STORE_ID`,
`SSLCOMMERZ_STORE_PASSWORD`, and `SSLCOMMERZ_SANDBOX`. Production credentials can
also be managed in Admin > Settings.

`BKASH`, `NAGAD`, `STRIPE`, `PAYPAL`, and `BANK_TRANSFER` exist in the database
enum but are not implemented.

## Testing

```bash
cd server && SKIP_DB_SETUP=1 ./node_modules/.bin/vitest run tests/settings/settings.registry.test.ts tests/settings/settings.crypto.test.ts
cd server && ./node_modules/.bin/tsc --noEmit
cd client && npm test
cd client && npm run type-check
```

Client tests cover redirect safety and HTML sanitization. GitHub Actions runs both
jobs on push and pull request (`.github/workflows/ci.yml`).

`npm test` runs the client suite. `npm run test:server` runs the full API suite and
requires a test database.

Database-backed suites refuse to run unless the database name contains `test`.
Set `ALLOW_NON_TEST_DB=1` only for a disposable database.

## Project structure

- `client/` Next.js storefront and dashboard
- `server/` Express API, Prisma schema, migrations, tests
- `docs/` deployment, upgrade, and design documents

## Demo content

The About and Vision pages contain sample marketing copy. Replace them before
launch. Support email, social links, site name, and site URL are configured
through `client/.env`.

## Deployment

See `docs/DEPLOYMENT.md` for Docker Compose, Render/Vercel, HTTPS, and backup
guidance. See `docs/UPGRADING.md` for upgrades of existing installations.

## License

MIT. See `LICENSE`. MIT permits commercial use, modification, and redistribution.
