import Link from "next/link";
import type { ProductPagination } from "@/features/catalog/api";

function hrefFor(
  basePath: string,
  filters: Record<string, string | undefined>,
  page: number
): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value) params.set(key, value);
  }
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

export default function ShopPagination({
  pagination,
  filters,
  basePath = "/shop",
}: {
  pagination: ProductPagination;
  filters: Record<string, string | undefined>;
  basePath?: string;
}) {
  const { page, totalPages, total } = pagination;
  if (totalPages <= 1) {
    return (
      <p className="mt-8 text-center text-sm text-zinc-500">
        {total} product{total === 1 ? "" : "s"}
      </p>
    );
  }

  const prev = page > 1 ? page - 1 : null;
  const next = page < totalPages ? page + 1 : null;

  return (
    <nav
      className="mt-10 mb-8 flex flex-col items-center gap-3"
      aria-label="Product pagination"
    >
      <p className="text-sm text-zinc-500">
        Page {page} of {totalPages} ({total} products)
      </p>
      <div className="flex items-center gap-3">
        {prev ? (
          <Link
            href={hrefFor(basePath, filters, prev)}
            className="h-10 px-4 inline-flex items-center border border-zinc-200 text-[10px] font-black uppercase tracking-widest hover:border-black"
          >
            Previous
          </Link>
        ) : (
          <span className="h-10 px-4 inline-flex items-center border border-zinc-100 text-[10px] font-black uppercase tracking-widest text-zinc-300">
            Previous
          </span>
        )}
        {next ? (
          <Link
            href={hrefFor(basePath, filters, next)}
            className="h-10 px-4 inline-flex items-center bg-zinc-900 text-[10px] font-black uppercase tracking-widest text-white hover:bg-black"
          >
            Next
          </Link>
        ) : (
          <span className="h-10 px-4 inline-flex items-center border border-zinc-100 text-[10px] font-black uppercase tracking-widest text-zinc-300">
            Next
          </span>
        )}
      </div>
    </nav>
  );
}
