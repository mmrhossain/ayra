import { dashboardApi } from "@/lib/api/dashboard";
import type {
  CreateSliderBody,
  Envelope,
  SliderListItem,
  SliderListParams,
  SliderListResult,
  UpdateSliderBody,
} from "@/features/dashboard/admin/sliders/types";

export type {
  CreateSliderBody,
  Envelope,
  SliderListItem,
  SliderListParams,
  SliderListResult,
  SliderPagination,
  UpdateSliderBody,
} from "@/features/dashboard/admin/sliders/types";

export { toSliderErrorMessage } from "@/features/dashboard/admin/sliders/utils";

const noStore = { cache: "no-store" as const };

export async function fetchSliderList(
  params: SliderListParams = {},
): Promise<SliderListResult> {
  const res = await dashboardApi.get<Envelope<SliderListResult>>(
    "/admin/sliders",
    {
      ...noStore,
      params: {
        page: params.page ?? 1,
        limit: params.limit ?? 20,
        title: params.title || undefined,
        isActive: params.isActive,
      },
    },
  );
  return res.data;
}

export async function createSlider(
  body: CreateSliderBody,
): Promise<SliderListItem> {
  const res = await dashboardApi.post<Envelope<SliderListItem>>(
    "/admin/sliders",
    { body },
  );
  return res.data;
}

export async function updateSlider(
  id: string,
  body: UpdateSliderBody,
): Promise<SliderListItem> {
  const res = await dashboardApi.patch<Envelope<SliderListItem>>(
    `/admin/sliders/${id}`,
    { body },
  );
  return res.data;
}

export async function deleteSlider(id: string): Promise<void> {
  await dashboardApi.delete<Envelope<unknown>>(`/admin/sliders/${id}`);
}
