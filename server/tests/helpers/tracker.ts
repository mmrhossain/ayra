import { prisma } from "../../src/lib/prisma.ts";

const run = async (fn: () => Promise<void>) => {
  await fn();
};

export class CleanupTracker {
  userIds: string[] = [];
  categoryIds: string[] = [];
  brandIds: string[] = [];
  productIds: string[] = [];
  variantIds: string[] = [];
  warehouseIds: string[] = [];
  inventoryIds: string[] = [];
  couponIds: string[] = [];
  orderIds: string[] = [];
  paymentIds: string[] = [];
  webhookLogIds: string[] = [];
  cartIds: string[] = [];
  guestCartSessionIds: string[] = [];
  reviewIds: string[] = [];
  faqCategoryIds: string[] = [];
  faqItemIds: string[] = [];
  blogCategoryIds: string[] = [];
  blogIds: string[] = [];
  sliderIds: string[] = [];
  collectionIds: string[] = [];
  mediaAssetIds: string[] = [];
  attributeIds: string[] = [];
  attributeValueIds: string[] = [];

  async cleanup() {
    const orders = [...this.orderIds];
    const payments = [...this.paymentIds];
    const variants = [...this.variantIds];
    const products = [...this.productIds];
    const users = [...this.userIds];
    const coupons = [...this.couponIds];
    const warehouses = [...this.warehouseIds];
    const inventories = [...this.inventoryIds];
      const carts = [...this.cartIds];
      const guestCartSessionIds = [...this.guestCartSessionIds];
      const webhookLogs = [...this.webhookLogIds];
      const reviews = [...this.reviewIds];
      const faqCategories = [...this.faqCategoryIds];
      const faqItems = [...this.faqItemIds];
      const blogCategories = [...this.blogCategoryIds];
      const blogs = [...this.blogIds];
      const sliders = [...this.sliderIds];
      const collections = [...this.collectionIds];
      const mediaAssets = [...this.mediaAssetIds];
      const categories = [...this.categoryIds];
      const brands = [...this.brandIds];
      const attributes = [...this.attributeIds];
      const attributeValues = [...this.attributeValueIds];

    try {
      if (payments.length) {
        await run(async () => {
          await prisma.refund.deleteMany({
            where: { paymentId: { in: payments } },
          });
          await prisma.paymentTransaction.deleteMany({
            where: { paymentId: { in: payments } },
          });
          await prisma.paymentEvent.deleteMany({
            where: { paymentId: { in: payments } },
          });
        });
      }

      if (orders.length) {
        const extraPayments = await prisma.payment.findMany({
          where: { orderId: { in: orders } },
          select: { id: true },
        });
        const extraIds = extraPayments.map((p) => p.id);
        if (extraIds.length) {
          await prisma.refund.deleteMany({
            where: { paymentId: { in: extraIds } },
          });
          await prisma.paymentTransaction.deleteMany({
            where: { paymentId: { in: extraIds } },
          });
          await prisma.paymentEvent.deleteMany({
            where: { paymentId: { in: extraIds } },
          });
          await prisma.payment.deleteMany({ where: { id: { in: extraIds } } });
        }

        await prisma.returnItem.deleteMany({
          where: { returnRequest: { orderId: { in: orders } } },
        });
        await prisma.returnRequest.deleteMany({
          where: { orderId: { in: orders } },
        });
        await prisma.couponUsage.deleteMany({
          where: { orderId: { in: orders } },
        });
        await prisma.stockReservation.deleteMany({
          where: { orderId: { in: orders } },
        });
        await prisma.orderEvent.deleteMany({
          where: { orderId: { in: orders } },
        });
        await prisma.orderStatusHistory.deleteMany({
          where: { orderId: { in: orders } },
        });
        await prisma.orderItem.deleteMany({ where: { orderId: { in: orders } } });
        await prisma.orderAddress.deleteMany({
          where: { orderId: { in: orders } },
        });
        await prisma.order.deleteMany({ where: { id: { in: orders } } });
      }

      if (payments.length) {
        await prisma.payment.deleteMany({ where: { id: { in: payments } } });
      }

      if (webhookLogs.length) {
        await prisma.paymentWebhookLog.deleteMany({
          where: { id: { in: webhookLogs } },
        });
      }

      if (coupons.length) {
        await prisma.couponUsage.deleteMany({
          where: { couponId: { in: coupons } },
        });
        await prisma.couponProduct.deleteMany({
          where: { couponId: { in: coupons } },
        });
        await prisma.couponCategory.deleteMany({
          where: { couponId: { in: coupons } },
        });
        await prisma.coupon.deleteMany({ where: { id: { in: coupons } } });
      }

      if (reviews.length) {
        await prisma.review.deleteMany({ where: { id: { in: reviews } } });
      }

      if (faqItems.length) {
        await prisma.faqItem.deleteMany({ where: { id: { in: faqItems } } });
      }

      if (sliders.length) {
        await prisma.slider.deleteMany({ where: { id: { in: sliders } } });
      }

      if (collections.length) {
        await prisma.productCollectionItem.deleteMany({
          where: { collectionId: { in: collections } },
        });
        await prisma.productCollection.deleteMany({
          where: { id: { in: collections } },
        });
      }

      if (mediaAssets.length) {
        await prisma.mediaAsset.deleteMany({
          where: { id: { in: mediaAssets } },
        });
      }

      if (faqCategories.length) {
        await prisma.faqItem.deleteMany({
          where: { categoryId: { in: faqCategories } },
        });
        await prisma.faqCategory.deleteMany({
          where: { id: { in: faqCategories } },
        });
      }

      if (blogs.length) {
        await prisma.blog.deleteMany({ where: { id: { in: blogs } } });
      }

      if (blogCategories.length) {
        await prisma.blog.deleteMany({
          where: { categoryId: { in: blogCategories } },
        });
        await prisma.blogCategory.deleteMany({
          where: { id: { in: blogCategories } },
        });
      }

      if (guestCartSessionIds.length) {
        await prisma.guestCart.deleteMany({
          where: { sessionId: { in: guestCartSessionIds } },
        });
      }

      if (carts.length) {
        await prisma.cartCoupon.deleteMany({ where: { cartId: { in: carts } } });
        await prisma.cartActivity.deleteMany({
          where: { cartId: { in: carts } },
        });
        await prisma.cartItem.deleteMany({ where: { cartId: { in: carts } } });
        await prisma.cart.deleteMany({ where: { id: { in: carts } } });
      }

      if (inventories.length) {
        await prisma.inventoryTransaction.deleteMany({
          where: { inventoryId: { in: inventories } },
        });
        await prisma.inventory.deleteMany({
          where: { id: { in: inventories } },
        });
      }

      if (variants.length) {
        await prisma.variantAttribute.deleteMany({
          where: { variantId: { in: variants } },
        });
        await prisma.productImage.deleteMany({
          where: { variantId: { in: variants } },
        });
        await prisma.inventoryEvent.deleteMany({
          where: { variantId: { in: variants } },
        });
        await prisma.inventoryTransaction.deleteMany({
          where: { variantId: { in: variants } },
        });
        await prisma.inventoryAdjustment.deleteMany({
          where: { variantId: { in: variants } },
        });
        await prisma.inventory.deleteMany({
          where: { variantId: { in: variants } },
        });
        await prisma.cartItem.deleteMany({
          where: { variantId: { in: variants } },
        });
        await prisma.wishlistItem.deleteMany({
          where: { variantId: { in: variants } },
        });
        await prisma.productVariant.deleteMany({
          where: { id: { in: variants } },
        });
      }

      if (products.length) {
        const leftoverVariants = await prisma.productVariant.findMany({
          where: { productId: { in: products } },
          select: { id: true },
        });
        const leftoverVariantIds = leftoverVariants.map((variant) => variant.id);
        if (leftoverVariantIds.length) {
          await prisma.variantAttribute.deleteMany({
            where: { variantId: { in: leftoverVariantIds } },
          });
          await prisma.inventoryEvent.deleteMany({
            where: { variantId: { in: leftoverVariantIds } },
          });
          await prisma.inventoryTransaction.deleteMany({
            where: { variantId: { in: leftoverVariantIds } },
          });
          await prisma.inventoryAdjustment.deleteMany({
            where: { variantId: { in: leftoverVariantIds } },
          });
          await prisma.inventory.deleteMany({
            where: { variantId: { in: leftoverVariantIds } },
          });
          await prisma.productImage.deleteMany({
            where: { variantId: { in: leftoverVariantIds } },
          });
          await prisma.productVariant.deleteMany({
            where: { id: { in: leftoverVariantIds } },
          });
        }
        await prisma.productCollectionItem.deleteMany({
          where: { productId: { in: products } },
        });
        await prisma.review.deleteMany({
          where: { productId: { in: products } },
        });
        await prisma.productImage.deleteMany({
          where: { productId: { in: products } },
        });
        await prisma.product.deleteMany({ where: { id: { in: products } } });
      }

      if (attributeValues.length) {
        await prisma.variantAttribute.deleteMany({
          where: { attributeValueId: { in: attributeValues } },
        });
        await prisma.attributeValue.deleteMany({
          where: { id: { in: attributeValues } },
        });
      }

      if (attributes.length) {
        await prisma.attributeValue.deleteMany({
          where: { attributeId: { in: attributes } },
        });
        await prisma.attribute.deleteMany({ where: { id: { in: attributes } } });
      }

      if (categories.length) {
        await prisma.category.deleteMany({ where: { id: { in: categories } } });
      }

      if (brands.length) {
        await prisma.brand.deleteMany({ where: { id: { in: brands } } });
      }

      if (warehouses.length) {
        await prisma.inventory.deleteMany({
          where: { warehouseId: { in: warehouses } },
        });
        await prisma.warehouse.deleteMany({
          where: { id: { in: warehouses } },
        });
      }

      if (users.length) {
        await prisma.mediaAsset.deleteMany({
          where: { ownerUserId: { in: users } },
        });
        const userEmails = await prisma.user.findMany({
          where: { id: { in: users } },
          select: { email: true },
        });
        const emails = userEmails.map((u) => u.email);
        if (emails.length) {
          await prisma.verification.deleteMany({
            where: { identifier: { in: emails } },
          });
        }

        const profiles = await prisma.customerProfile.findMany({
          where: { userId: { in: users } },
          select: { id: true },
        });
        const profileIds = profiles.map((p) => p.id);
        if (profileIds.length) {
          const leftoverCarts = await prisma.cart.findMany({
            where: { customerProfileId: { in: profileIds } },
            select: { id: true },
          });
          const leftoverCartIds = leftoverCarts.map((c) => c.id);
          if (leftoverCartIds.length) {
            await prisma.cartCoupon.deleteMany({
              where: { cartId: { in: leftoverCartIds } },
            });
            await prisma.cartActivity.deleteMany({
              where: { cartId: { in: leftoverCartIds } },
            });
            await prisma.cartItem.deleteMany({
              where: { cartId: { in: leftoverCartIds } },
            });
            await prisma.cart.deleteMany({
              where: { id: { in: leftoverCartIds } },
            });
          }
          await prisma.couponUsage.deleteMany({
            where: { customerProfileId: { in: profileIds } },
          });
          await prisma.review.deleteMany({
            where: { customerProfileId: { in: profileIds } },
          });
          const wishlists = await prisma.wishlist.findMany({
            where: { customerProfileId: { in: profileIds } },
            select: { id: true },
          });
          const wishlistIds = wishlists.map((w) => w.id);
          if (wishlistIds.length) {
            await prisma.wishlistItem.deleteMany({
              where: { wishlistId: { in: wishlistIds } },
            });
            await prisma.wishlist.deleteMany({
              where: { id: { in: wishlistIds } },
            });
          }
          await prisma.address.deleteMany({
            where: { customerProfileId: { in: profileIds } },
          });
          await prisma.customerProfile.deleteMany({
            where: { id: { in: profileIds } },
          });
        }
        await prisma.notification.deleteMany({ where: { userId: { in: users } } });
        await prisma.vendorProfile.deleteMany({ where: { userId: { in: users } } });
        await prisma.session.deleteMany({ where: { userId: { in: users } } });
        await prisma.account.deleteMany({ where: { userId: { in: users } } });
        await prisma.user.deleteMany({ where: { id: { in: users } } });
      }
    } finally {
      this.userIds = [];
      this.categoryIds = [];
      this.brandIds = [];
      this.productIds = [];
      this.variantIds = [];
      this.warehouseIds = [];
      this.inventoryIds = [];
      this.couponIds = [];
      this.orderIds = [];
      this.paymentIds = [];
      this.webhookLogIds = [];
      this.cartIds = [];
      this.guestCartSessionIds = [];
      this.reviewIds = [];
      this.faqCategoryIds = [];
      this.faqItemIds = [];
      this.blogCategoryIds = [];
      this.blogIds = [];
      this.sliderIds = [];
      this.collectionIds = [];
      this.mediaAssetIds = [];
      this.attributeIds = [];
      this.attributeValueIds = [];
    }
  }
}
