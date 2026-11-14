import { OpenApiGeneratorV3 } from "@asteasolutions/zod-to-openapi";
import { env } from "../../config/env.ts";
import { registry } from "./registry.ts";
import "./security.ts";
import "./common-schemas.ts";

import "../../modules/auth/auth.openapi.ts";
import "../../modules/catalog/category/category.openapi.ts";
import "../../modules/catalog/brand/brand.openapi.ts";
import "../../modules/catalog/product/product.openapi.ts";
import "../../modules/catalog/inventory/inventory.openapi.ts";
import "../../modules/warehouse/warehouse.openapi.ts";
import "../../modules/shipping/shipping.openapi.ts";
import "../../modules/catalog/attribute/attribute.openapi.ts";
import "../../modules/cart/cart.openapi.ts";
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

export function generateOpenApiDocument() {
  const generator = new OpenApiGeneratorV3(registry.definitions);

  return generator.generateDocument({
    openapi: "3.0.3",
    info: {
      title: `${env.BETTER_AUTH_APP_NAME} API`,
      version: "1.0.0",
      description:
        `HTTP API for the ${env.BETTER_AUTH_APP_NAME} e-commerce backend. Authenticate with a Better Auth bearer token unless a route is public or webhook-signed.`,
    },
    servers: [{ url: "/", description: "Current host" }],
  });
}
