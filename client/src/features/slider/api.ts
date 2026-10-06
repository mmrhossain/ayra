import { api } from "@/lib/api/store-front";
import { SliderListItem } from "../dashboard/admin/sliders/api/slider";

type Envelope<T> = {
    success: true;
    message: string;
    data: T;
};


export default async function getSliders(): Promise<SliderListItem[]> {
    try {
        const res = await api.get<Envelope<SliderListItem[]>>(
            "/sliders/active",
            // { next: { revalidate: 60, tags: ["sliders"] } }
        );
        return res?.data || [];
    } catch {
        return [];
    }
}
