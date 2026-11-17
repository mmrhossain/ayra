import { api } from "@/lib/api/store-front";
import type { Envelope } from "@/lib/api/http";
import type { ProductListItem } from "./types";
export type CollectionPage = {
  collection: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    source: string;
  };
  items: ProductListItem[];
  nextCursor: string | null;
};
export async function fetchCollectionProducts(slug: string, cursor?: string): Promise<CollectionPage> {
  return (await api.get<Envelope<CollectionPage>>("/collections/" + encodeURIComponent(slug) + "/products", {
    cache: "no-store",
    params: {
      cursor
    }
  })).data;
}
