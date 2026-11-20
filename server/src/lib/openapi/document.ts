import { OpenApiGeneratorV3 } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import { env } from "../../config/env.ts";
import { registry } from "./registry.ts";
import "./security.ts";
import { jsonContent } from "./common-schemas.ts";

import "../../modules/auth/auth.openapi.ts";
import "../../modules/catalog/category/category.openapi.ts";
import "../../modules/catalog/brand/brand.openapi.ts";
import "../../modules/catalog/collection/collection.openapi.ts";
import "../../modules/catalog/product/product.openapi.ts";
import "../../modules/catalog/inventory/inventory.openapi.ts";
import "../../modules/warehouse/warehouse.openapi.ts";
import "../../modules/shipping/shipping.openapi.ts";
import "../../modules/catalog/attribute/attribute.openapi.ts";
import "../../modules/cart/cart.openapi.ts";
import "../../modules/tax/tax.openapi.ts";
import "../../modules/order/order.openapi.ts";
import "../../modules/payment/payment.openapi.ts";
import "../../modules/settings/settings.openapi.ts";
import "../../modules/coupon/coupon.openapi.ts";
import "../../modules/wishlist/wishlist.openapi.ts";
import "../../modules/review/review.openapi.ts";
import "../../modules/slider/slider.openapi.ts";
import "../../modules/home/home.openapi.ts";
import "../../modules/ai/ai.openapi.ts";
import "../../modules/content/legal/legal.openapi.ts";
import "../../modules/content/faq/faq.openapi.ts";
import "../../modules/content/blog/blog.openapi.ts";
import "../../modules/content/contact/contact.openapi.ts";
import "../../modules/analytics/analytics.openapi.ts";
import "../../modules/address/address.openapi.ts";
import "../../modules/geography/geography.openapi.ts";
import "../../modules/profile/profile.openapi.ts";
import "../../modules/media/media.openapi.ts";
import "../../modules/staff/staff.openapi.ts";
import "../../modules/shipments/shipments.openapi.ts";
import "../../modules/courier/courier.openapi.ts";
import "../../modules/audit/admin-audit.openapi.ts";
import "../../modules/notification/in-app.openapi.ts";

registry.registerPath({
  method: "get",
  path: "/health",
  tags: ["Operations"],
  summary: "Check HTTP server liveness",
  responses: {
    200: {
      description: "Server is running",
      ...jsonContent(z.object({ success: z.literal(true), message: z.string(), timestamp: z.string().datetime() })),
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/ready",
  tags: ["Operations"],
  summary: "Check PostgreSQL and Redis readiness",
  responses: {
    200: { description: "Ready", ...jsonContent(z.object({ success: z.literal(true), message: z.string() })) },
    503: { description: "Dependency unavailable", ...jsonContent(z.object({ success: z.literal(false), message: z.string() })) },
  },
});

export function generateOpenApiDocument() {
  const generator = new OpenApiGeneratorV3(registry.definitions);

  return generator.generateDocument({
    openapi: "3.0.3",
    info: {
      title: `${env.BETTER_AUTH_APP_NAME} API`,
      version: "1.0.0",
      description:
        `HTTP API for the ${env.BETTER_AUTH_APP_NAME} e-commerce backend. Protected operations use a Better Auth session cookie. Browser clients should sign in on the same origin before trying protected operations.`,
    },
    servers: [{ url: "/", description: "Current host" }],
  });
}
