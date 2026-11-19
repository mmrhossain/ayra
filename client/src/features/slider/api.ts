import { api } from "@/lib/api/store-front";
import type { Envelope } from "@/lib/api/http";
import type { SliderListItem } from "@/features/dashboard/admin/sliders/types";

export async function fetchActiveSliders(): Promise<SliderListItem[]> {
  const response = await api.get<Envelope<SliderListItem[]>>("/sliders", {
    next: { revalidate: 60, tags: ["home"] },
  });
  return response.data;
}
