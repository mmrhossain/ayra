import { randomUUID } from "node:crypto";
import { prisma } from "../../src/lib/prisma.ts";
import type { CleanupTracker } from "./tracker.ts";
import type { TestUser } from "./auth.ts";

export const testAddress = {
  fullName: "Test Buyer",
  phone: "01700000000",
  email: "buyer@example.test",
  country: "Bangladesh",
  division: "Dhaka",
  district: "Dhaka",
  thana: "Dhanmondi",
  addressLine1: "12 Test Avenue",
};

export const createTestOrder = async (
  tracker: CleanupTracker,
  user: TestUser,
  opts?: {
    status?: "PENDING" | "CONFIRMED" | "PROCESSING" | "PACKED" | "SHIPPED" | "DELIVERED";
    subtotal?: number;
    discountAmount?: number;
    taxAmount?: number;
    shippingAmount?: number;
    grandTotal?: number;
    deliveredAt?: Date | null;
    pricesIncludeTax?: boolean;
    taxRatePercent?: number;
    currency?: "BDT" | "USD";
  }
) => {
  const orderNumber = `ORD-TEST-${randomUUID().slice(0, 10).toUpperCase()}`;
  const status = opts?.status ?? "PENDING";
  const subtotal = opts?.subtotal ?? opts?.grandTotal ?? 100;
  const grandTotal = opts?.grandTotal ?? subtotal;
  const taxAmount = opts?.taxAmount ?? 0;
  const deliveredAt =
    opts && "deliveredAt" in opts
      ? opts.deliveredAt
      : status === "DELIVERED"
        ? new Date()
        : null;

  const order = await prisma.order.create({
    data: {
      orderNumber,
      status,
      paymentStatus: "PENDING",
      subtotal,
      discountAmount: opts?.discountAmount ?? 0,
      taxAmount,
      shippingAmount: opts?.shippingAmount ?? 0,
      grandTotal,
      currency: opts?.currency ?? "BDT",
      // Historic test orders with recorded tax used tax-exclusive prices.
      pricesIncludeTax:
        opts?.pricesIncludeTax ?? !(taxAmount > 0),
      taxRatePercent: opts?.taxRatePercent ?? 0,
      deliveredAt,
      customerProfileId: user.customerProfileId,
      addresses: {
        create: [
          {
            type: "BILLING",
            fullName: testAddress.fullName,
            phone: testAddress.phone,
            email: testAddress.email,
            country: testAddress.country,
            division: testAddress.division,
            district: testAddress.district,
            thana: testAddress.thana,
            addressLine1: testAddress.addressLine1,
          },
          {
            type: "SHIPPING",
            fullName: testAddress.fullName,
            phone: testAddress.phone,
            email: testAddress.email,
            country: testAddress.country,
            division: testAddress.division,
            district: testAddress.district,
            thana: testAddress.thana,
            addressLine1: testAddress.addressLine1,
          },
        ],
      },
    },
  });
  tracker.orderIds.push(order.id);
  return order;
};

export const createSslcommerzPayment = async (
  tracker: CleanupTracker,
  orderId: string,
  opts?: { amount?: number; status?: "INITIATED" | "PENDING" }
) => {
  const providerReference = `TRAN-TEST-${randomUUID().slice(0, 10).toUpperCase()}`;
  const payment = await prisma.payment.create({
    data: {
      orderId,
      method: "SSLCOMMERZ",
      status: opts?.status ?? "INITIATED",
      amount: opts?.amount ?? 100,
      provider: "SSLCOMMERZ",
      providerReference,
    },
  });
  tracker.paymentIds.push(payment.id);
  return payment;
};
