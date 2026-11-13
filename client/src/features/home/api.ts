import type { Envelope } from "@/lib/api/http";
import { api } from "@/lib/api/store-front";
import type { ProductListItem } from "@/features/catalog/types";
import type { HomePayload } from "./types";

export type HomeSectionProductsPage = {
  items: ProductListItem[];
  nextCursor: string | null;
};

export async function fetchHome(): Promise<HomePayload> {
  const res = await api.get<Envelope<HomePayload>>("/home", {
    next: { revalidate: 60, tags: ["home"] },
  });
  return res.data;
}

export async function fetchHomeSectionProducts(
  sectionId: string,
  cursor: string
): Promise<HomeSectionProductsPage> {
  const res = await api.get<Envelope<HomeSectionProductsPage>>(
    `/home/sections/${encodeURIComponent(sectionId)}/products`,
    { params: { cursor } }
  );
  return res.data;
}
