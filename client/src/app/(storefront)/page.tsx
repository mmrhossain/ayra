import { fetchHome } from "@/features/home/api";
import HomePage from "@/features/home/components/HomePage";
import HomePageSkeleton from "@/features/home/skeleton/HomePageSkeleton";
import { Suspense } from "react";

async function HomeContent() {
  // Handle the error gracefully without a try/catch block
  const data = await fetchHome().catch(() => null);

  if (!data) {
    return (
      <div className="container py-24 text-center text-gray-400">Home is unavailable right now</div>
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
