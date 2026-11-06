import type { Envelope } from "@/lib/api/http";
import { api } from "@/lib/api/store-front";
import type { HomePayload } from "./types";

export async function fetchHome(): Promise<HomePayload> {
  const res = await api.get<Envelope<HomePayload>>("/home", {
    next: { revalidate: 60, tags: ["home"] },
  });
  return res.data;
}
