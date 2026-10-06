import HomePage from "@/features/home/components/HomePage";
import { fetchHome } from "@/features/home/api";
import HomePageSkeleton from "@/skeleton/homePageSkeleton";
import { Suspense } from "react";

async function HomeContent() {
  const data = await fetchHome();

  if (!data) {
    return (
      <div className="container py-24 text-center text-gray-400">
        Home is unavailable right now
      </div>
    );
  }

  return <HomePage data={data} />;
}

export default function Home() {
  return (
    <Suspense fallback={<HomePageSkeleton />}>
      <HomeContent />
    </Suspense>
  );
}
