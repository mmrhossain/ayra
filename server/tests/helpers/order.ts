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
    grandTotal?: number;
  }
) => {
  const orderNumber = `ORD-TEST-${randomUUID().slice(0, 10).toUpperCase()}`;
  const grandTotal = opts?.grandTotal ?? 100;

  const order = await prisma.order.create({
    data: {
      orderNumber,
      status: opts?.status ?? "PENDING",
      paymentStatus: "PENDING",
      subtotal: grandTotal,
      grandTotal,
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
