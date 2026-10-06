import { prisma, type TransactionClient } from "../../lib/prisma.ts";
import { AppError } from "../../common/errors/AppError.ts";
import { paginated } from "../../common/utils/paginate.ts";
import { Prisma } from "../../generated/prisma/client.ts";
import type {
  CouponContext,
  CouponRecord,
  CouponSnapshot,
  CreateCouponInput,
  ListCouponsQuery,
  UpdateCouponInput,
} from "./types.ts";

export type { CouponContext };

const moneyValue = (
  value: { toNumber: () => number } | number | string | null | undefined,
) => {
  if (value == null) return null;
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value);
  return value.toNumber();
};

const toCouponSnapshot = (coupon: CouponRecord): CouponSnapshot => ({
  id: coupon.id,
  code: coupon.code,
  isActive: coupon.isActive,
  status: coupon.status,
  startsAt: coupon.startsAt,
  expiresAt: coupon.expiresAt,
  minimumOrderAmount: moneyValue(coupon.minimumOrderAmount),
  usageLimit: coupon.usageLimit,
  usageCount: coupon.usageCount,
  usageLimitPerCustomer: coupon.usageLimitPerCustomer,
  discountType: coupon.discountType,
  discountValue: moneyValue(coupon.discountValue) ?? 0,
  maximumDiscountAmount: moneyValue(coupon.maximumDiscountAmount),
});

type CouponRestrictions = {
  productIds: Set<string>;
  categoryIds: Set<string>;
};

const loadCouponRestrictions = async (
  db: Pick<TransactionClient, "$queryRaw">,
  couponId: string,
): Promise<CouponRestrictions> => {
  const rows = await db.$queryRaw<Array<{ kind: string; id: string }>>`
    SELECT 'product' AS kind, "productId" AS id
    FROM "CouponProduct"
    WHERE "couponId" = ${couponId}
    UNION ALL
    SELECT 'category', "categoryId"
    FROM "CouponCategory"
    WHERE "couponId" = ${couponId}
  `;
  const productIds = new Set<string>();
  const categoryIds = new Set<string>();
  for (const row of rows) {
    if (row.kind === "product") productIds.add(row.id);
    else categoryIds.add(row.id);
  }
  return { productIds, categoryIds };
};

const assertCouponApplicable = (
  restrictions: CouponRestrictions,
  ctx: CouponContext,
) => {
  if (restrictions.productIds.size > 0) {
    const match = ctx.productIds.some((id) => restrictions.productIds.has(id));
    if (!match) {
      throw new AppError("Coupon is not applicable to the items in the cart", 400);
    }
  }
  if (restrictions.categoryIds.size > 0) {
    const match = ctx.productCategoryIds.some((id) => restrictions.categoryIds.has(id));
    if (!match) {
      throw new AppError("Coupon is not applicable to the items in the cart", 400);
    }
  }
};

const eligibleSubtotalFromRestrictions = (
  restrictions: CouponRestrictions,
  ctx: CouponContext,
) => {
  const restricted =
    restrictions.productIds.size > 0 || restrictions.categoryIds.size > 0;
  if (!restricted || !ctx.lines || ctx.lines.length === 0) {
    return ctx.subtotal;
  }

  return ctx.lines.reduce((sum, line) => {
    const productMatch =
      restrictions.productIds.size === 0 || restrictions.productIds.has(line.productId);
    const categoryMatch =
      restrictions.categoryIds.size === 0 || restrictions.categoryIds.has(line.categoryId);
    return productMatch && categoryMatch ? sum + line.subtotal : sum;
  }, 0);
};

const calculateDiscount = (
  coupon: { discountType: string; discountValue: number; maximumDiscountAmount: number | null },
  subtotal: number
) => {
  switch (coupon.discountType) {
    case "PERCENTAGE": {
      const discount = (subtotal * coupon.discountValue) / 100;
      return coupon.maximumDiscountAmount
        ? Math.min(discount, coupon.maximumDiscountAmount)
        : discount;
    }
    case "FIXED_AMOUNT":
      return Math.min(coupon.discountValue, subtotal);
    case "FREE_SHIPPING":
      return 0;
    default:
      return 0;
  }
};

export const validateCouponRow = async (
  coupon: CouponSnapshot,
  customerProfileId: string,
  ctx: CouponContext
) => {
  const now = new Date();

  if (!coupon.isActive || coupon.status !== "ACTIVE") {
    throw new AppError("Coupon is not active", 400);
  }
  if (now < coupon.startsAt || now > coupon.expiresAt) {
    throw new AppError("Coupon is not valid at this time", 400);
  }
  if (coupon.minimumOrderAmount !== null && ctx.subtotal < coupon.minimumOrderAmount) {
    throw new AppError("Order subtotal is below the coupon minimum", 400);
  }
  if (coupon.usageLimit !== null && coupon.usageCount >= coupon.usageLimit) {
    throw new AppError("Coupon usage limit has been reached", 400);
  }
  if (coupon.usageLimitPerCustomer !== null) {
    const used = await prisma.couponUsage.count({
      where: { couponId: coupon.id, customerProfileId },
    });
    if (used >= coupon.usageLimitPerCustomer) {
      throw new AppError("Coupon has already been used by this customer", 400);
    }
  }

  const restrictions = await loadCouponRestrictions(prisma, coupon.id);
  assertCouponApplicable(restrictions, ctx);

  const basis = eligibleSubtotalFromRestrictions(restrictions, ctx);
  return calculateDiscount(coupon, basis);
};

export const reverseCouponUsage = async (tx: TransactionClient, orderId: string) => {
  const usages = await tx.couponUsage.findMany({
    where: { orderId },
    select: { id: true, couponId: true },
  });
  if (usages.length === 0) return;

  const couponIds = [...new Set(usages.map((usage) => usage.couponId))].sort((a, b) =>
    a.localeCompare(b),
  );
  await tx.$queryRaw`
    SELECT id FROM "Coupon"
    WHERE id IN (${Prisma.join(couponIds)})
    ORDER BY id ASC
    FOR UPDATE`;

  await tx.couponUsage.deleteMany({ where: { orderId } });

  const counts = new Map<string, number>();
  for (const usage of usages) {
    counts.set(usage.couponId, (counts.get(usage.couponId) ?? 0) + 1);
  }

  for (const [couponId, count] of counts) {
    await tx.coupon.update({
      where: { id: couponId },
      data: { usageCount: { decrement: count } },
    });
  }
};

const uniqueIds = (ids: string[] | undefined): string[] =>
  [...new Set((ids ?? []).map((id) => id.trim()).filter(Boolean))];

const assertIdsExist = async (
  kind: "product" | "category",
  ids: string[],
) => {
  if (ids.length === 0) return;
  const count =
    kind === "product"
      ? await prisma.product.count({ where: { id: { in: ids } } })
      : await prisma.category.count({ where: { id: { in: ids } } });
  if (count !== ids.length) {
    throw new AppError(
      kind === "product"
        ? "One or more products were not found"
        : "One or more categories were not found",
      400,
    );
  }
};

const findCouponByCode = async (code: string, excludeId?: string) => {
  const normalized = code.trim().toUpperCase();
  return prisma.coupon.findFirst({
    where: {
      code: { equals: normalized, mode: "insensitive" },
      ...(excludeId ? { NOT: { id: excludeId } } : {}),
    },
  });
};

export const validateCouponCode = async (
  code: string,
  customerProfileId: string,
  ctx: CouponContext
) => {
  const coupon = await findCouponByCode(code);

  if (!coupon || coupon.deletedAt) {
    throw new AppError("Invalid coupon code", 400);
  }

  const discountAmount = await validateCouponRow(
    toCouponSnapshot(coupon),
    customerProfileId,
    ctx
  );

  return { coupon, discountAmount };
};

export const applyCouponAtomic = async (
    code: string,
    customerProfileId: string,
    ctx: CouponContext,
    tx: TransactionClient
) => {
  // Normalize the code to prevent case-sensitivity or whitespace issues
  const normalizedCode = code ? code.trim().toUpperCase() : "";
  const rows = await tx.$queryRaw<CouponRecord[]>`
    SELECT id, code, "isActive", status, "startsAt", "expiresAt",
           "minimumOrderAmount", "usageLimit", "usageCount", "usageLimitPerCustomer",
           "discountType", "discountValue", "maximumDiscountAmount", "deletedAt"
    FROM "Coupon"
    WHERE UPPER(code) = ${normalizedCode}
    FOR UPDATE`;

  const coupon = rows[0];
  if (!coupon || coupon.deletedAt) {
    throw new AppError("Invalid coupon code", 400);
  }

  const now = new Date();
  const snapshot = toCouponSnapshot(coupon);

  if (!snapshot.isActive || snapshot.status !== "ACTIVE") {
    throw new AppError("Coupon is not active", 400);
  }
  if (now < snapshot.startsAt || now > snapshot.expiresAt) {
    throw new AppError("Coupon is not valid at this time", 400);
  }
  if (
      snapshot.minimumOrderAmount !== null &&
      ctx.subtotal < snapshot.minimumOrderAmount
  ) {
    throw new AppError("Order subtotal is below the coupon minimum", 400);
  }
  if (snapshot.usageLimit !== null && snapshot.usageCount >= snapshot.usageLimit) {
    throw new AppError("Coupon usage limit has been reached", 400);
  }
  if (snapshot.usageLimitPerCustomer !== null) {
    const usageRows = await tx.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM "CouponUsage"
      WHERE "couponId" = ${coupon.id} AND "customerProfileId" = ${customerProfileId}
      FOR UPDATE`;
    if (usageRows.length >= snapshot.usageLimitPerCustomer) {
      throw new AppError("Coupon has already been used by this customer", 400);
    }
  }

  const restrictions = await loadCouponRestrictions(tx, coupon.id);
  assertCouponApplicable(restrictions, ctx);

  const basis = eligibleSubtotalFromRestrictions(restrictions, ctx);
  const discountAmount = calculateDiscount(snapshot, basis);

  return { coupon, discountAmount };
};

export const listCoupons = async (query: ListCouponsQuery) => {
  const search = query.search?.trim();
  const where: Prisma.CouponWhereInput = {
    deletedAt: null,
    ...(search && {
      OR: [
        { code: { contains: search, mode: "insensitive" } },
        { name: { contains: search, mode: "insensitive" } },
      ],
    }),
  };

  const [items, total] = await Promise.all([
    prisma.coupon.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    }),
    prisma.coupon.count({ where }),
  ]);

  return paginated(items, query.page, query.limit, total);
};

export const createCoupon = async (input: CreateCouponInput) => {
  if (input.expiresAt <= input.startsAt) {
    throw new AppError("expiresAt must be after startsAt", 400);
  }

  const productIds = uniqueIds(input.applicableProductIds);
  const categoryIds = uniqueIds(input.applicableCategoryIds);
  await Promise.all([
    assertIdsExist("product", productIds),
    assertIdsExist("category", categoryIds),
  ]);

  const existing = await findCouponByCode(input.code);
  if (existing) throw new AppError("Coupon code already exists", 409);

  return prisma.coupon.create({
    data: {
      code: input.code.trim().toUpperCase(),
      name: input.name,
      description: input.description ?? null,
      status: input.status,
      discountType: input.discountType,
      discountValue: input.discountType === "FREE_SHIPPING" ? 0 : input.discountValue,
      minimumOrderAmount: input.minimumOrderAmount ?? null,
      maximumDiscountAmount: input.maximumDiscountAmount ?? null,
      usageLimit: input.usageLimit ?? null,
      usageLimitPerCustomer: input.usageLimitPerCustomer ?? null,
      startsAt: input.startsAt,
      expiresAt: input.expiresAt,
      isActive: input.isActive,
      applicableProductIds: productIds,
      applicableCategoryIds: categoryIds,
      ...(productIds.length > 0 && {
        products: {
          create: productIds.map((productId) => ({ productId })),
        },
      }),
      ...(categoryIds.length > 0 && {
        categories: {
          create: categoryIds.map((categoryId) => ({
            categoryId,
          })),
        },
      }),
    },
  });
};

export const updateCoupon = async (
  id: string,
  input: UpdateCouponInput
) => {
  const existing = await prisma.coupon.findUnique({ where: { id } });
  if (!existing || existing.deletedAt) {
    throw new AppError("Coupon not found", 404);
  }

  const startsAt = input.startsAt ?? existing.startsAt;
  const expiresAt = input.expiresAt ?? existing.expiresAt;
  if (expiresAt <= startsAt) {
    throw new AppError("expiresAt must be after startsAt", 400);
  }

  if (input.code) {
    const clash = await findCouponByCode(input.code, id);
    if (clash) throw new AppError("Coupon code already exists", 409);
  }

  const productIds =
    input.applicableProductIds !== undefined
      ? uniqueIds(input.applicableProductIds)
      : undefined;
  const categoryIds =
    input.applicableCategoryIds !== undefined
      ? uniqueIds(input.applicableCategoryIds)
      : undefined;

  await Promise.all([
    productIds ? assertIdsExist("product", productIds) : Promise.resolve(),
    categoryIds ? assertIdsExist("category", categoryIds) : Promise.resolve(),
  ]);

  const discountType = input.discountType ?? existing.discountType;
  const discountValue =
    discountType === "FREE_SHIPPING"
      ? 0
      : input.discountValue !== undefined
        ? input.discountValue
        : undefined;

  return prisma.coupon.update({
    where: { id },
    data: {
      ...(input.code !== undefined && { code: input.code.trim().toUpperCase() }),
      ...(input.name !== undefined && { name: input.name }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.status !== undefined && { status: input.status }),
      ...(input.discountType !== undefined && { discountType: input.discountType }),
      ...(discountValue !== undefined && { discountValue }),
      ...(input.minimumOrderAmount !== undefined && {
        minimumOrderAmount: input.minimumOrderAmount,
      }),
      ...(input.maximumDiscountAmount !== undefined && {
        maximumDiscountAmount: input.maximumDiscountAmount,
      }),
      ...(input.usageLimit !== undefined && { usageLimit: input.usageLimit }),
      ...(input.usageLimitPerCustomer !== undefined && {
        usageLimitPerCustomer: input.usageLimitPerCustomer,
      }),
      ...(input.startsAt !== undefined && { startsAt: input.startsAt }),
      ...(input.expiresAt !== undefined && { expiresAt: input.expiresAt }),
      ...(input.isActive !== undefined && { isActive: input.isActive }),
      ...(productIds !== undefined && {
        applicableProductIds: productIds,
        products: {
          deleteMany: {},
          create: productIds.map((productId) => ({ productId })),
        },
      }),
      ...(categoryIds !== undefined && {
        applicableCategoryIds: categoryIds,
        categories: {
          deleteMany: {},
          create: categoryIds.map((categoryId) => ({ categoryId })),
        },
      }),
    },
  });
};

export const deleteCoupon = async (id: string) => {
  const existing = await prisma.coupon.findUnique({ where: { id } });
  if (!existing || existing.deletedAt) {
    throw new AppError("Coupon not found", 404);
  }

  return prisma.coupon.update({ where: { id }, data: { deletedAt: new Date() } });
};
