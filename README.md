# AYRA Shop

AYRA Shop is a single-store e-commerce application with a customer storefront, a staff dashboard, and an Express API. It supports browsing and guest carts, customer checkout and order history, and day-to-day store operations from catalog management through fulfillment.

## What’s included

| Area | Features |
| --- | --- |
| Storefront | Collections, category browsing, search and filters, product variants, reviews, wishlist, guest cart, coupons, and checkout |
| Customer account | Profile, saved addresses, orders, returns, and notifications |
| Admin dashboard | Products, inventory, tax classes, shipping zones, orders, payments, refunds, content, and staff access |
| Integrations | Cash on delivery, SSLCommerz, optional Google sign-in, Cloudinary media, email, and courier integrations |

## Architecture

- `client/` contains the Next.js App Router storefront and dashboard, built with React, TypeScript, Tailwind CSS, and TanStack Query.
- `server/` contains the Express API, Better Auth configuration, Prisma schema and migrations, OpenAPI definitions, and integration tests.
- `docs/` contains repository-specific performance and responsive-layout audits. CI is defined in [`.github/workflows/ci.yml`](.github/workflows/ci.yml).

Browser API requests go through the Next.js `/backend-proxy` rewrite. Server-rendered pages call Express through `BACKEND_ORIGIN`. Better Auth uses session cookies. Express enforces customer ownership, staff scopes, and action permissions. PostgreSQL stores application data, and Redis supports the API’s session and infrastructure services.

## Run locally

Use Node.js 22+, npm, PostgreSQL 16+, and Redis 7+. Start PostgreSQL and Redis before running the API. Run the commands below from the repository root.

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
npm run install:all
```

On PowerShell, use `Copy-Item server/.env.example server/.env` and `Copy-Item client/.env.example client/.env` for the copy steps. Edit the local environment files before continuing. Set working PostgreSQL and Redis URLs, a generated `BETTER_AUTH_SECRET`, and your bootstrap admin credentials.

```bash
cd server
npx prisma generate
cd ..
npm run migrate
npm run seed:admin
```

`seed:admin` uses `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and `ADMIN_ROLE=ADMIN` to bootstrap a super admin. If the email already exists, the script updates access and keeps the existing password. For a fresh checkout setup, configure the warehouse, inventory, and shipping in the dashboard. The [optional server seed](server/prisma/seed.ts) also installs default warehouse, shipping, and email-template records. It expects `SEED_ADMIN_PASSWORD` and either `SEED_ADMIN_EMAIL` or `ADMIN_EMAIL`.

Start each development process in a separate terminal.

```bash
npm run dev:server
npm run dev:client
```

| Service | Local URL |
| --- | --- |
| Storefront | [localhost:3000](http://localhost:3000) |
| Admin dashboard | [localhost:3000/admin](http://localhost:3000/admin) |
| API base | [localhost:5000/api/v1](http://localhost:5000/api/v1) |
| Swagger UI | [localhost:5000/api-docs](http://localhost:5000/api-docs) |
| OpenAPI JSON | [localhost:5000/api-docs.json](http://localhost:5000/api-docs.json) |
| API health and dependency readiness | [`/health`](http://localhost:5000/health) · [`/ready`](http://localhost:5000/ready) |

## Configuration

Start with the [server environment template](server/.env.example) and the [client environment template](client/.env.example). Keep real environment files and credentials out of version control.

| Setting | Purpose |
| --- | --- |
| `DATABASE_URL`, `DIRECT_URL`, `REDIS_URL` | API database, Prisma migration connection, and Redis |
| `FRONTEND_URL`, `BETTER_AUTH_URL`, `BETTER_AUTH_SECRET` | Trusted storefront origin, Better Auth base origin, and session secret |
| `BACKEND_ORIGIN` | Client-side project configuration for the Next.js server’s Express upstream |
| `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SITE_NAME`, `NEXT_PUBLIC_SUPPORT_EMAIL` | Public branding and site metadata. Rebuild the client after changing build-time public values. |
| `ENABLE_API_DOCS` | Swagger is enabled outside production. Set this to `true` to enable it in a production-mode environment. |
| `SETTINGS_ENCRYPTION_KEY` | Optional dedicated key for encrypted platform settings. Keep it stable after storing payment credentials. |

The server template includes the required reserved token settings. Google OAuth, media uploads, email delivery, online payments, and automated courier booking require their respective provider configuration. Use SSLCommerz sandbox credentials and a gateway-reachable callback URL when testing online payments.

## Working on the API

OpenAPI definitions live alongside the Express modules. Update the relevant `*.openapi.ts` when changing a request, response, route, or access rule. Refresh [the checked-in OpenAPI snapshot](client/openapi-dashboard.json) from the local API, then regenerate both client type files.

```bash
curl -fsS http://localhost:5000/api-docs.json -o client/openapi-dashboard.json
npm --prefix client run generate:api
npm --prefix client run generate:dashboard-api
```

Use `curl.exe` on PowerShell. Protected calls use the Better Auth session cookie. To try them in Swagger, sign in on the same host first. Checkout uses `POST /api/v1/checkout`. Reuse the same `Idempotency-Key` with the same payload when retrying an order submission.

## Checks

```bash
npm --prefix client run lint
npm --prefix client run type-check
npm --prefix server run lint
npm run build
```

For a server type check without writing build output, run `npx tsc --noEmit` from `server/`.

Run `npm run test:server` against a disposable database whose name contains `test`. Point both database URLs at that database and apply the migrations first. For an individual database-free suite, run it from `server/` with `SKIP_DB_SETUP=1` set. [CI](.github/workflows/ci.yml) lists the database-free suites used in automated checks.

## Deployment

The [Compose file](docker-compose.yml) defines the storefront, API, PostgreSQL, and Redis. The [API image](server/Dockerfile) applies migrations at startup, and the [client image](client/Dockerfile) runs Next.js standalone output. Compose uses local database credentials and localhost origins. Set deployment-specific secrets, HTTPS origins, provider callbacks, and database backups before using it outside local development.

## License

[MIT](LICENSE)
