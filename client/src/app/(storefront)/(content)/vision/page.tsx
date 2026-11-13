import Vision from "@/features/content/components/vision/Vision";
import { PUBLIC_SITE_URL } from "@/config/site";

export const metadata = {
  title: "Our Vision",
  description: "Learn about our vision and the values behind our store.",
  ...(PUBLIC_SITE_URL
    ? { alternates: { canonical: new URL("/vision", PUBLIC_SITE_URL).toString() } }
    : {}),
};

export default function VisionPage() {
  return <Vision />;
}
