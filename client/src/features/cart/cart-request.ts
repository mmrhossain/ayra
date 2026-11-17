import { dashboardApi } from "@/lib/api/dashboard";
import type { Envelope } from "@/lib/api/http";
import { createSharedRequest } from "@/lib/shared-request";
import type { CustomerCart } from "@/features/checkout/types";

export const customerCartRequest = createSharedRequest(async () => {
  const response = await dashboardApi.get<Envelope<CustomerCart | null>>("/cart", { cache: "no-store" });
  return response.data;
});
