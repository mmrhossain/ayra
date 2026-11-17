# Collections and sale prices

Manage product groups at Admin > Catalog > Collections. Choose Selected products
for a curated collection; add products with search and use Up/Down to set their
order. A product can belong to several collections. Only active, non-deleted
products appear publicly.

Automatic sources are New Arrivals, Featured, Products on Sale, Best Sellers,
and Trending. Featured can optionally use a curated list. Best Sellers and
Trending reuse the existing product-metrics worker. Products on Sale means at
least one live variant has a compare-at price above its selling price.

Use Homepage placement to make a collection a homepage section. Collection page
only keeps it off the homepage. Active/schedule controls apply to public pages
as well as homepage visibility. Dates entered in the editor use the browser's
local timezone and are sent to the server as UTC. Deactivate hides the collection
without removing its products or changing their prices.

Active homepage collections replace the existing automatic fallback sections.
Configure every desired homepage section. Until any are configured, New Arrivals,
Featured and Discount fallbacks remain available. Homepage See more links now
open /collections/{slug}; those pages share the same product resolver and cursor
pagination as homepage sections. Collection writes invalidate the existing home
cache. No new database tables or migration are required.

Under Products > Edit > Variants, Selling price is the actual charged price and
Compare-at price is an optional original/reference price. Example: selling 800,
compare-at 1000 displays 20% off. Leave the reference blank to remove a sale.
Older equal reference/selling prices remain valid and display no discount.
Backend validation checks partial price changes against the saved companion
price. Clearing the reference does not change the Default variant selection.

Product cards use the lowest valid selling-price variant and that same variant's
reference price. They no longer combine prices from different variants. The
wishlist action uses that displayed variant as well.

Collections do not apply discounts by themselves. Existing coupons still target
products/categories and can discount a sale price further. A sale price already
reduces the subtotal, so that saving is not deducted again as an order discount.
Coupon discounts remain separate and VAT is calculated on the resulting price.

New API routes: GET /api/v1/collections/{slug}/products with an optional cursor;
GET/POST /api/v1/admin/collections; GET/PUT/DELETE
/api/v1/admin/collections/{id}. DELETE deactivates. Admin access requires the
existing Catalog permission. Product membership updates are validated once and
written in batches within the collection transaction.

Validation uses mocked persistence and frontend component tests. A live database
and browser smoke test remain appropriate before deployment; this change does
not deploy or modify production records.
