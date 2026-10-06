import { redirect } from "next/navigation";

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug } = await params;
  redirect(`/product-details/${slug}`);
}
