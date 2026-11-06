import { AppError } from "../../../../common/errors/AppError.ts";
import { isPrismaCode } from "../../../../common/utils/prisma-error.ts";
import { ensureUniqueSlug } from "../../../../common/utils/slug.ts";
import type { TransactionClient } from "../../../../lib/prisma.ts";
import {
  MAX_GENERATED_SKU_RETRIES,
  assertTypedSku,
  buildSuggestedSku,
  isBlankSku,
  type SkuAttributeInput,
} from "./sku-generator.ts";

export const allocateUniqueSlug = async (
  tx: TransactionClient,
  desired: string,
  excludeId?: string,
): Promise<string> => {
  const rows = await tx.product.findMany({
    where: {
      deletedAt: null,
      slug: { startsWith: desired },
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    select: { slug: true },
  });
  return ensureUniqueSlug(desired, new Set(rows.map((row) => row.slug)));
};

const liveSkuEquals = (sku: string, excludeId?: string) => ({
  deletedAt: null,
  sku: { equals: sku, mode: "insensitive" as const },
  ...(excludeId ? { id: { not: excludeId } } : {}),
});

export const findLiveSku = async (
  tx: TransactionClient,
  sku: string,
  excludeId?: string,
) =>
  tx.productVariant.findFirst({
    where: liveSkuEquals(sku, excludeId),
    select: { id: true, sku: true },
  });

export const assertTypedSkuAvailable = async (
  tx: TransactionClient,
  sku: string,
  excludeId?: string,
): Promise<void> => {
  const existing = await findLiveSku(tx, sku, excludeId);
  if (existing) throw new AppError("Variant SKU already exists", 409);
};

const isSkuUniqueConflict = (err: unknown): boolean => {
  if (!isPrismaCode(err, "P2002")) return false;
  const target = (err as { meta?: { target?: unknown } }).meta?.target;
  const fields = Array.isArray(target)
    ? target.map(String)
    : typeof target === "string"
      ? [target]
      : [];
  return fields.some((field) => field.toLowerCase().includes("sku"));
};

/**
 * Loads every live SKU that could collide with any of `skus` in a single query.
 * For each candidate this covers the same rows the per-candidate allocator used
 * to fetch (`sku = candidate` or `sku LIKE candidate-%`), so a batch allocation
 * keyed off the returned set is equivalent to doing one query per candidate.
 */
export const prefetchTakenSkus = async (
  tx: TransactionClient,
  skus: Array<string | null | undefined>,
): Promise<Set<string>> => {
  const unique = [
    ...new Set(skus.filter((sku): sku is string => Boolean(sku)).map((sku) => sku.toLowerCase())),
  ];
  if (!unique.length) return new Set();
  const rows = await tx.productVariant.findMany({
    where: {
      deletedAt: null,
      OR: unique.flatMap((sku) => [
        { sku: { equals: sku, mode: "insensitive" as const } },
        { sku: { startsWith: `${sku}-`, mode: "insensitive" as const } },
      ]),
    },
    select: { sku: true },
  });
  return new Set(rows.map((row) => row.sku.toLowerCase()));
};

export const allocateGeneratedSku = async (
  tx: TransactionClient,
  candidate: string,
  excludeId?: string,
  reservedSkus: string[] = [],
  takenBase?: Set<string>,
): Promise<string> => {
  // A caller that already prefetched the relevant live SKUs can skip this query.
  // `excludeId` is only meaningful for updates, where no prefetch is supplied.
  const taken =
    takenBase && !excludeId
      ? new Set([...takenBase, ...reservedSkus.map((sku) => sku.toLowerCase())])
      : new Set([
          ...(
            await tx.productVariant.findMany({
              where: {
                deletedAt: null,
                ...(excludeId ? { id: { not: excludeId } } : {}),
                OR: [
                  { sku: { equals: candidate, mode: "insensitive" } },
                  { sku: { startsWith: `${candidate}-`, mode: "insensitive" } },
                ],
              },
              select: { sku: true },
            })
          ).map((row) => row.sku.toLowerCase()),
          ...reservedSkus.map((sku) => sku.toLowerCase()),
        ]);
  // `taken` already contains every live SKU equal to `candidate` or prefixed
  // with `candidate-` (respecting excludeId), so membership in `taken` is
  // authoritative. Do not add the returned candidate to `taken` before the
  // final loop check: doing so made every generated SKU start at `-2`.
  let next = candidate;
  for (let attempt = 0; attempt <= MAX_GENERATED_SKU_RETRIES; attempt += 1) {
    if (!taken.has(next.toLowerCase())) {
      return next;
    }
    next = `${candidate}-${attempt + 2}`;
  }
  throw new AppError("Variant SKU already exists", 409);
};

export const allocateUniqueSkus = async (
  tx: TransactionClient,
  skus: string[],
  excludeIds: string[] = [],
): Promise<string[]> => allocateGeneratedSkus(tx, skus, excludeIds);

export const allocateGeneratedSkus = async (
  tx: TransactionClient,
  candidates: string[],
  excludeIds: string[] = [],
): Promise<string[]> => {
  const allocated: string[] = [];
  const sessionTaken = new Set<string>();
  for (const candidate of candidates) {
    let next = candidate;
    for (let attempt = 0; attempt <= MAX_GENERATED_SKU_RETRIES; attempt += 1) {
      if (!sessionTaken.has(next.toLowerCase())) {
        const existing = await findLiveSku(tx, next);
        if (!existing || (excludeIds.length && excludeIds.includes(existing.id))) {
          sessionTaken.add(next.toLowerCase());
          allocated.push(next);
          break;
        }
      }
      next = `${candidate}-${attempt + 2}`;
      if (attempt === MAX_GENERATED_SKU_RETRIES) {
        throw new AppError("Variant SKU already exists", 409);
      }
    }
  }
  return allocated;
};

export const isSkuUniqueConflictError = isSkuUniqueConflict;

export const skuAttributesForValues = async (
  tx: TransactionClient,
  attributeValueIds: string[],
): Promise<SkuAttributeInput[]> => {
  if (!attributeValueIds.length) return [];
  const values = await tx.attributeValue.findMany({
    where: { id: { in: attributeValueIds } },
    select: {
      id: true,
      value: true,
      attributeId: true,
      attribute: { select: { name: true } },
    },
  });
  if (values.length !== attributeValueIds.length) {
    throw new AppError("One or more attribute values not found", 400);
  }
  return values.map((value) => ({
    attributeId: value.attributeId,
    attributeName: value.attribute.name,
    value: value.value,
  }));
};

/**
 * Batch variant of `skuAttributesForValues`: returns a lookup so the caller can
 * resolve attributes for many variants from a single query.
 */
export const attributeValueLookup = async (
  tx: TransactionClient,
  attributeValueIds: string[],
): Promise<Map<string, SkuAttributeInput>> => {
  const ids = [...new Set(attributeValueIds)];
  if (!ids.length) return new Map();
  const values = await tx.attributeValue.findMany({
    where: { id: { in: ids } },
    select: {
      id: true,
      value: true,
      attributeId: true,
      attribute: { select: { name: true } },
    },
  });
  return new Map(
    values.map((value) => [
      value.id,
      {
        attributeId: value.attributeId,
        attributeName: value.attribute.name,
        value: value.value,
      },
    ]),
  );
};

export const resolveVariantSku = async (
  tx: TransactionClient,
  input: {
    sku?: string | null | undefined;
    categoryName: string;
    brandName?: string | null | undefined;
    attributeValueIds?: string[] | undefined;
    attributes?: SkuAttributeInput[] | undefined;
    excludeId?: string | undefined;
    reservedSkus?: string[] | undefined;
    takenSkus?: Set<string> | undefined;
  },
): Promise<{ sku: string; generated: boolean; candidate: string }> => {
  const reservedSkus = input.reservedSkus ?? [];
  if (!isBlankSku(input.sku)) {
    const sku = input.sku as string;
    assertTypedSku(sku);
    if (reservedSkus.some((value) => value.toLowerCase() === sku.toLowerCase())) {
      throw new AppError("Variant SKU already exists", 409);
    }
    if (input.takenSkus && !input.excludeId) {
      if (input.takenSkus.has(sku.toLowerCase())) {
        throw new AppError("Variant SKU already exists", 409);
      }
    } else {
      await assertTypedSkuAvailable(tx, sku, input.excludeId);
    }
    return { sku, generated: false, candidate: sku };
  }
  const attributes =
    input.attributes ??
    (await skuAttributesForValues(tx, input.attributeValueIds ?? []));
  const candidate = buildSuggestedSku({
    brandName: input.brandName,
    categoryName: input.categoryName,
    attributes,
  });
  const sku = await allocateGeneratedSku(
    tx,
    candidate,
    input.excludeId,
    reservedSkus,
    input.takenSkus,
  );
  return { sku, generated: true, candidate };
};

export const insertWithGeneratedSkuRetry = async <T>(
  _tx: TransactionClient,
  input: {
    sku: string;
    generated: boolean;
    candidate: string;
    excludeId?: string;
  },
  insert: (sku: string) => Promise<T>,
): Promise<T> => {
  let sku = input.sku;
  for (let attempt = 0; attempt <= MAX_GENERATED_SKU_RETRIES; attempt += 1) {
    try {
      return await insert(sku);
    } catch (err) {
      if (!input.generated || !isSkuUniqueConflict(err)) throw err;
      sku = `${input.candidate}-${attempt + 2}`;
    }
  }
  throw new AppError("Variant SKU already exists", 409);
};
