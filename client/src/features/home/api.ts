import type { Envelope } from "@/features/catalog/types";
import { api } from "@/lib/api/store-front";
import type { HomePayload } from "./types";

export async function fetchHome(): Promise<HomePayload | null> {
  try {
    const res = await api.get<Envelope<HomePayload>>("/home", {
      next: { revalidate: 60, tags: ["home"] },
    });
    return res.data ?? null;
  } catch {
    return null;
  }
}
