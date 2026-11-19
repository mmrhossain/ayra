import { unstable_rethrow } from "next/navigation";
import SliderCarousel from "@/features/slider/components/SliderCarousel";
import { fetchActiveSliders } from "@/features/slider/api";
import type { SliderListItem } from "@/features/dashboard/admin/sliders/types";

const fallback: SliderListItem[] = [{
  id: "customer-dashboard-banner",
  title: "Customer Dashboard Banner",
  imageUrl: "/images/banner/banner_image.webp",
  priority: 0,
  isActive: true,
}];

export default async function TopHero() {
  let sliders: SliderListItem[] = [];
  try {
    sliders = await fetchActiveSliders();
  } catch (error) {
    unstable_rethrow(error);
  }
  return <SliderCarousel sliders={sliders.length ? sliders : fallback} variant="banner" showContent={false} showControls={false} />;
}
