import { AppError } from "../../../../common/errors/AppError.ts";
import { generateSlug } from "../../../../common/utils/slug.ts";
import type { TransactionClient } from "../../../../lib/prisma.ts";
import type { CreateProductPayload } from "../types/product.types.ts";
import { allocateUniqueSlug } from "../utils/unique-identity.ts";

export const assertCategoryAndBrand = async (
  tx: TransactionClient,
  categoryId: string,
  brandId?: string | null,
) => {
  const category = await tx.category.findFirst({
    where: { id: categoryId, deletedAt: null },
    select: { id: true, name: true },
  });
  if (!category) {
    throw new AppError("Category not found", 404);
  }
  if (!brandId) return { category, brand: null };
  const brand = await tx.brand.findFirst({
    where: { id: brandId, deletedAt: null },
    select: { id: true, name: true },
  });
  if (!brand) {
    throw new AppError("Brand not found", 404);
  }
  return { category, brand };
};

export const resolveCreateSlug = async (
  tx: TransactionClient,
  input: CreateProductPayload,
) => {
  const explicit = Boolean(input.slug?.trim());
  const desired = explicit
    ? input.slug!.trim()
    : generateSlug(input.name, "Product name");
  const slug = await allocateUniqueSlug(tx, desired);
  if (explicit && slug !== desired) {
    throw new AppError("Product slug already exists", 409);
  }
  return slug;
};
