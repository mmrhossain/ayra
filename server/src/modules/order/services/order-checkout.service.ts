import { transaction } from "../../../lib/prisma.ts";
import { AppError } from "../../../common/errors/AppError.ts";
import { quoteShipping } from "../../shipping/services/shipping.service.ts";
import { applyCouponAtomic } from "../../coupon/coupon.service.ts";
import { enqueueOrderConfirmation } from "../../notification/services/notification.service.ts";
import type { CheckoutInput } from "../../cart/types.ts";
import {
  computeCheckoutTotals,
  formatVariantName,
  generateOrderNumber,
  isOrderNumberConflict,
  omitOrderCostPrice,
  ORDER_NUMBER_ATTEMPTS,
  saveCheckoutAddressIfNew,
  toOrderAddress,
} from "../utils/order-helpers.ts";
import { assertCheckoutItemsAvailable } from "../utils/order-validation.ts";
import { reserveCheckoutStock } from "./order-stock.service.ts";

export const checkout = async (
    customerProfileId: string,
    input: CheckoutInput
) => {
  const runCheckout = (orderNumber: string) => transaction(async (tx) => {
    const cartRows = await tx.$queryRaw<
        Array<{ id: string }>
    >`SELECT id FROM "Cart" WHERE id IN (SELECT id FROM "Cart" WHERE "customerProfileId" = ${customerProfileId} AND status = 'ACTIVE' ORDER BY "createdAt" ASC LIMIT 1) FOR UPDATE`;

    if (!cartRows[0]) throw new AppError("Cart is empty", 400);

    const cart = await tx.cart.findUniqueOrThrow({
      where: { id: cartRows[0].id },
      include: {
        items: {
          include: {
            variant: {
              include: {
                product: {
                  select: {
                    name: true,
                    status: true,
                    deletedAt: true,
                    categoryId: true,
                  },
                },
                attributes: { include: { attributeValue: true } },
              },
            },
          },
        },
        coupon: true,
        customerProfile: {
          select: { userId: true, user: { select: { name: true } } },
        },
      },
    });

    if (cart.items.length === 0) throw new AppError("Cart is empty", 400);

    assertCheckoutItemsAvailable(cart.items);

    const subtotal = cart.items.reduce(
        (s, i) => s + Number(i.variant!.price) * i.quantity,
        0
    );

    const productIds = cart.items.map((i) => i.productId);
    const productCategoryIds = cart.items.map((item) => item.variant!.product.categoryId);
    const couponLines = cart.items.map((item) => ({
      productId: item.productId,
      categoryId: item.variant!.product.categoryId,
      subtotal: Number(item.variant!.price) * item.quantity,
    }));

    let discountAmount = 0;
    let coupon: { id: string; discountType: string } | null = null;
    const couponCode = input.couponCode ?? cart.coupon?.couponCode;

    if (couponCode) {
      const res = await applyCouponAtomic(
          couponCode,
          customerProfileId,
          { subtotal, productIds, productCategoryIds, lines: couponLines },
          tx
      );
      discountAmount = res.discountAmount;
      coupon = res.coupon;
    }

    const deliveryAddress = input.shippingAddress ?? input.billingAddress;
    const shippingQuote = await quoteShipping(
      deliveryAddress,
      input.shippingMethodCode,
      subtotal,
      tx
    );
    const { taxAmount, shippingAmount, grandTotal } = computeCheckoutTotals(
      subtotal,
      discountAmount,
      coupon,
      shippingQuote.shippingAmount,
    );

    const { reservations, inventoryTransactionsData } = await reserveCheckoutStock(
      tx,
      cart.items.map((item) => ({
        sku: item.sku,
        quantity: item.quantity,
        variantId: item.variantId,
      })),
      orderNumber,
      customerProfileId,
    );

    await tx.inventoryTransaction.createMany({
      data: inventoryTransactionsData,
    });

    const order = await tx.order.create({
      data: {
        orderNumber,
        subtotal,
        discountAmount,
        taxAmount,
        shippingAmount,
        shippingMethodName: shippingQuote.methodName,
        shippingMethodCode: shippingQuote.methodCode,
        grandTotal,
        notes: input.notes ?? null,
        customerProfileId,
        items: {
          create: cart.items.map((item) => ({
            productName: item.variant!.product.name,
            sku: item.variant!.sku,
            variantName: formatVariantName(item.variant!),
            quantity: item.quantity,
            unitPrice: Number(item.variant!.price),
            costPrice: item.variant!.costPrice,
            discountAmount: 0,
            taxAmount: 0,
            subtotal: Number(item.variant!.price) * item.quantity,
            variantId: item.variantId,
          })),
        },
        addresses: {
          create: [
            toOrderAddress(input.billingAddress, "BILLING"),
            toOrderAddress(input.shippingAddress ?? input.billingAddress, "SHIPPING"),
          ],
        },
        statusHistory: {
          create: { status: "PENDING", remarks: "Order created" },
        },
        events: {
          create: { eventType: "ORDER_CREATED", metadata: { orderNumber } },
        },
        payments: {
          create: {
            method: input.paymentMethod,
            status: "PENDING",
            amount: grandTotal,
          },
        },
        ...(coupon
          ? {
              couponUsages: {
                create: {
                  couponId: coupon.id,
                  customerProfileId,
                  discountAmount,
                },
              },
            }
          : {}),
      },
      include: { items: true, payments: true, addresses: true },
    });

    await saveCheckoutAddressIfNew(tx, customerProfileId, deliveryAddress);

    await tx.stockReservation.createMany({
      data: reservations.map(r => ({
        variantId: r.variantId,
        quantity: r.quantity,
        orderId: order.id,
        warehouseId: r.warehouseId,
        expiresAt: r.expiresAt,
      })),
      skipDuplicates: true,
    });
    if (coupon) {
      await tx.coupon.update({
        where: { id: coupon.id },
        data: { usageCount: { increment: 1 } },
      });
    }
    await tx.cart.update({
      where: { id: cart.id },
      data: {
        status: "CHECKED_OUT",
        activities: {
          create: {
            eventType: "CHECKOUT_STARTED",
            metadata: { orderId: order.id, orderNumber },
          },
        },
      },
    });

    return {
      order: omitOrderCostPrice(order),
      profile: cart.customerProfile,
    };
  }, {
    timeout: 20_000
  });

  for (let attempt = 1; attempt <= ORDER_NUMBER_ATTEMPTS; attempt++) {
    try {
      const { order, profile } = await runCheckout(generateOrderNumber());
      if (profile) {
        const itemsSummary = order.items
          .map((item) => {
            const label = item.variantName
              ? `${item.productName} (${item.variantName})`
              : item.productName;
            return `${item.quantity}x ${label}`;
          })
          .join("<br/>");
        await enqueueOrderConfirmation(profile.userId, {
          customerName: profile.user.name,
          orderNumber: order.orderNumber,
          items: itemsSummary,
          grandTotal: Number(order.grandTotal).toFixed(2),
          currency: order.currency,
        });
      }
      return order;
    } catch (err) {
      const lastAttempt = attempt === ORDER_NUMBER_ATTEMPTS;
      if (!isOrderNumberConflict(err) || lastAttempt) throw err;
    }
  }

  throw new AppError("Unable to allocate a unique order number", 500);
};
