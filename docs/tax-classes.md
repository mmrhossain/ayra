# Product tax classes

Products optionally reference TaxClass through taxClassId. Multiple products in
one category can have different classes. A missing or inactive class has an
effective rate of zero. No Bangladesh VAT rate is hardcoded.

Manage classes under Admin > Catalog > Tax classes. Product create/edit includes
a class selector. API endpoints are GET/POST /api/v1/admin/tax-classes and
PUT/DELETE /api/v1/admin/tax-classes/:id. DELETE deactivates the class. Assigned
classes cannot be physically deleted because the foreign key uses RESTRICT.

checkout.taxEnabled is the only tax switch. Enabling it calculates VAT from each
product class after discounts, adds it to the total, and shows the rate and amount
in Cart Summary and Order Review. Disabling it sets tax to zero and hides both tax
rows. Rates are managed only through TaxClass. The old inclusive-price, global-rate
and checkout-display settings and unused calculators have been removed.

Cart and guest estimates use current variant prices, integer minor units, and
assigned tax classes. Coupon discounts are allocated only to eligible lines
before tax, with deterministic remainder allocation. Each line's tax rounds once
and order tax is the sum of those snapshots. Shipping is excluded from tax.

Redis caches only the tax-class reference list for 120 seconds and invalidates it
after class create/update/deactivation. Cart and shipping responses use no-store.
Checkout queries assigned classes fresh inside its existing order transaction,
recalculates prices, coupon discount, tax, shipping and total, then saves all five
order totals and taxClassName/taxRate/taxAmount on each order item. React Query
shares active checkout requests but does not retain results after unmount.

The migration is additive. It copies any existing global rate to LEGACY_VAT and
assigns existing products to it, preserves prices and order amounts, and retains
old columns and settings rows. Historical item class names and rates remain null
because they cannot always be reliably reconstructed. Existing reporting uses
each historical order's saved rate, never today's classes. Existing refund/reporting fallbacks are intact.
New products with no assigned class have zero tax. Historical order pricing
snapshots remain solely for correct refunds and reporting; old settings rows
are ignored. New orders always add tax separately, regardless of any previous
prices-include-tax setting. Product prices are not automatically rewritten.

## Rollout

1. Back up the database and apply the migration on staging first.
2. From server, run npx prisma migrate deploy, npx prisma generate, and npm run build.
3. Deploy the server and client; review migrated class assignments and flags.

The migration has not been applied to a live database by this change. Existing
server instances can keep reading the additive schema during rollout, but retire
old instances before editing tax rates so all checkouts use product classes.

## Verification

Server: SKIP_DB_SETUP=1 npm test -- tests/order/tax-calculation.test.ts
tests/order/tax-checkout.test.ts tests/cart/cart-pricing.test.ts
tests/catalog/tax-cache.test.ts tests/settings/settings.registry.test.ts

Also run server npm run build, npx prisma validate, and client npm run type-check.
The focused suites use mocks and do not validate a live PostgreSQL migration or
Redis connection. Run the database-backed cart/order suites against a migrated,
disposable test database before production rollout.
