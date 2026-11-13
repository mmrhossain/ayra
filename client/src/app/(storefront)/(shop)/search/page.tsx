import { redirect } from "next/navigation";

type SearchParams = {
  result?: string;
  page?: string;
};

export default async function Page({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const slug = (sp.result ?? "").trim();

  if (!slug) redirect("/shop");
  const page = Math.max(1, Number(sp.page) || 1);
  const keyword = slug.replace(/-/g, " ");
  const params = new URLSearchParams({ search: keyword, page: String(page) });
  redirect(`/shop?${params.toString()}`);
}
