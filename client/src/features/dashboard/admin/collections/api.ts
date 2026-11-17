import { dashboardApi } from "@/lib/api/dashboard";
import type { Envelope } from "@/lib/api/http";
export const collectionsKey = ["admin-collections"] as const;
export type CollectionSource = "MANUAL" | "NEW_ARRIVALS" | "BEST_SELLERS" | "DISCOUNT" | "TRENDING" | "FEATURED";
export type CollectionInput = {
  name: string;
  slug: string;
  description: string | null;
  source: CollectionSource;
  placement: "HOME" | "LANDING" | "NONE";
  sortOrder: number;
  limit: number;
  startsAt: string | null;
  endsAt: string | null;
  isActive: boolean;
  productIds: string[];
};
export type Collection = Omit<CollectionInput, "productIds"> & {
  id: string;
  _count?: {
    products: number;
  };
  products?: Array<{
    productId: string;
    sortOrder: number;
    product: {
      id: string;
      name: string;
      status: string;
      deletedAt: string | null;
    };
  }>;
};
export async function fetchCollections(page: number, search = "") {
  return (await dashboardApi.get<Envelope<{
    items: Collection[];
    pagination: {
      total: number;
      totalPages: number;
    };
  }>>("/admin/collections", {
    cache: "no-store",
    params: {
      page,
      limit: 20,
      search: search || undefined
    }
  })).data;
}
export async function fetchCollection(id: string) {
  return (await dashboardApi.get<Envelope<Collection>>("/admin/collections/" + encodeURIComponent(id), {
    cache: "no-store"
  })).data;
}
export async function saveCollection(input: CollectionInput, id?: string) {
  return id ? dashboardApi.put("/admin/collections/" + encodeURIComponent(id), {
    body: input
  }) : dashboardApi.post("/admin/collections", {
    body: input
  });
}
export async function archiveCollection(id: string) {
  return dashboardApi.delete("/admin/collections/" + encodeURIComponent(id));
}
