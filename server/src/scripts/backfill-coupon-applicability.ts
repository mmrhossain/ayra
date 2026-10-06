import { prisma } from "../lib/prisma.ts";

const backfillCouponApplicability = async () => {
  const coupons = await prisma.coupon.findMany({
    select: {
      id: true,
      applicableProductIds: true,
      applicableCategoryIds: true,
    },
  });

  let productRows = 0;
  let categoryRows = 0;

  for (const coupon of coupons) {
    if (coupon.applicableProductIds.length > 0) {
      const result = await prisma.couponProduct.createMany({
        data: coupon.applicableProductIds.map((productId) => ({
          couponId: coupon.id,
          productId,
        })),
        skipDuplicates: true,
      });
      productRows += result.count;
    }

    if (coupon.applicableCategoryIds.length > 0) {
      const result = await prisma.couponCategory.createMany({
        data: coupon.applicableCategoryIds.map((categoryId) => ({
          couponId: coupon.id,
          categoryId,
        })),
        skipDuplicates: true,
      });
      categoryRows += result.count;
    }
  }

  console.log(
    `Backfill complete: ${productRows} CouponProduct rows, ${categoryRows} CouponCategory rows`,
  );
};

backfillCouponApplicability()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
