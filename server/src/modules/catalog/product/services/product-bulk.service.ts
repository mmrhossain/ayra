import { AppError } from "../../../../common/errors/AppError.ts";
import { CacheKeys, cacheDel, invalidateCatalogCache } from "../../../../lib/cache.ts";
import { prisma } from "../../../../lib/prisma.ts";
import type { BulkProductActionInput } from "../validators/product.validators.ts";
import { deleteProduct } from "./product.service.ts";

export type BulkProductResult = {
  requested: number;
  affected: number;
  failed: string[];
};

// Deletes touch media bookkeeping and several rows per product; bound the
// fan-out so a 100-id request cannot exhaust the connection pool.
const DELETE_CONCURRENCY = 10;

const liveProductSlugs = async (ids: string[]): Promise<Map<string, string>> => {
  if (!ids.length) return new Map();
  const rows = await prisma.product.findMany({
    where: { id: { in: ids }, deletedAt: null },
    select: { id: true, slug: true },
  });
  return new Map(rows.map((row) => [row.id, row.slug]));
};

/**
 * Applies one action to many products at once. Status/featured/category are a
 * single `updateMany` and therefore naturally idempotent; delete fans out to
 * `deleteProduct` (bounded) because it also handles media bookkeeping.
 * Unknown/soft-deleted ids are reported back as `failed` rather than aborting
 * the whole batch.
 */
export const bulkUpdateProducts = async (
  input: BulkProductActionInput,
): Promise<BulkProductResult> => {
  const ids = [...new Set(input.ids)];
  const requested = ids.length;

  if (input.type === "delete") {
    const failed: string[] = [];
    let affected = 0;
    for (let i = 0; i < ids.length; i += DELETE_CONCURRENCY) {
      const chunk = ids.slice(i, i + DELETE_CONCURRENCY);
      const outcomes = await Promise.allSettled(
        chunk.map((id) => deleteProduct(id)),
      );
      outcomes.forEach((outcome, index) => {
        if (outcome.status === "fulfilled") affected += 1;
        else failed.push(chunk[index] as string);
      });
    }
    return { requested, affected, failed };
  }

  const slugsById = await liveProductSlugs(ids);
  const knownIds = [...slugsById.keys()];
  const failed = ids.filter((id) => !slugsById.has(id));

  let affected: number;
  if (input.type === "set-status") {
    const result = await prisma.product.updateMany({
      where: { id: { in: knownIds }, deletedAt: null },
      data: { status: input.status },
    });
    affected = result.count;
  } else if (input.type === "set-featured") {
    const result = await prisma.product.updateMany({
      where: { id: { in: knownIds }, deletedAt: null },
      data: { isFeatured: input.isFeatured },
    });
    affected = result.count;
  } else {
    const category = await prisma.category.findFirst({
      where: { id: input.categoryId, deletedAt: null },
      select: { id: true },
    });
    if (!category) throw new AppError("Category not found", 400);
    const result = await prisma.product.updateMany({
      where: { id: { in: knownIds }, deletedAt: null },
      data: { categoryId: input.categoryId },
    });
    affected = result.count;
  }

  // One global invalidation plus the affected product-detail keys, instead of
  // once per product.
  await invalidateCatalogCache();
  const slugs = [...new Set(slugsById.values())];
  if (slugs.length) {
    await cacheDel(...slugs.map((slug) => CacheKeys.productSlug(slug)));
  }

  return { requested, affected, failed };
};
