import { fetchHome } from "@/features/home/api";
import HomePage from "@/features/home/components/HomePage";
import HomePageSkeleton from "@/features/home/skeleton/HomePageSkeleton";
import { fetchPublicSettingsOrDefault } from "@/features/settings/server";
import { Suspense } from "react";

async function HomeContent() {
  const [data, settings] = await Promise.all([
    fetchHome().catch(() => null),
    fetchPublicSettingsOrDefault(),
  ]);

  if (!data) {
    return (
      <div className="container py-24 text-center text-gray-400">Home is unavailable right now</div>
    );
  }

  return <HomePage data={data} storeName={settings.store.name} />;
}

export default function Home() {
  return (
    <Suspense fallback={<HomePageSkeleton />}>
      <HomeContent />
    </Suspense>
  );
}
