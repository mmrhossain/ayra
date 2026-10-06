import ShopPage from "./[...slug]/page";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default async function RootShopPage({ searchParams }: { searchParams: SearchParams }) {
  return <ShopPage params={Promise.resolve({ slug: [] })} searchParams={searchParams} />;
}
