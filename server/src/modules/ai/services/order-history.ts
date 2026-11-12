import { logger } from "../../../common/looger/logger.ts";
import { getOrCreateCustomerProfile } from "../../../common/utils/customerProfile.ts";
import { isStaffRole, STAFF_CANNOT_SHOP_MESSAGE } from "../../../common/utils/roles.ts";
import { prisma } from "../../../lib/prisma.ts";

const FALLBACK_MESSAGE =
  "এই মুহূর্তে সাড়া দিতে সমস্যা হচ্ছে, একটু পরে চেষ্টা করুন";

const ORDER_LIMIT = 8;

const ORDER_INTENT =
  /\b(order|orders|tracking|track|refund|return|invoice|payment)\b|অর্ডার|ট্র্যাক|রিফান্ড|রিটার্ন/i;

const ACCOUNT_INTENT =
  /\b(account|password|address|wishlist|my email|my phone)\b|অ্যাকাউন্ট|পাসওয়ার্ড|ঠিকানা/i;

export const CHAT_LOGIN_REQUIRED =
  "Please log in to ask about your orders or account.";

export function isOrderIntent(message: string): boolean {
  return ORDER_INTENT.test(message.trim());
}

export function isProtectedIntent(message: string): boolean {
  const text = message.trim();
  if (!text) return false;
  return isOrderIntent(text) || ACCOUNT_INTENT.test(text);
}

function isBangla(message: string): boolean {
  return /[\u0980-\u09FF]/.test(message);
}

function formatMoney(amount: unknown, currency: string): string {
  return `${String(amount)} ${currency}`;
}

function paymentLabel(method: string | undefined, bangla: boolean): string {
  if (method === "COD") return bangla ? "ক্যাশ অন ডেলিভারি (COD)" : "Cash on delivery (COD)";
  if (method === "SSLCOMMERZ") return bangla ? "অনলাইন পেমেন্ট (SSLCommerz)" : "Online payment (SSLCommerz)";
  return method ?? (bangla ? "জানা নেই" : "unknown");
}

function isUnpaid(paymentStatus: string): boolean {
  return paymentStatus !== "PAID" && paymentStatus !== "REFUNDED";
}

export async function buildOrderHistoryAnswer(
  userId: string,
  message: string,
): Promise<string> {
  const bangla = isBangla(message);

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    if (isStaffRole(user?.role)) {
      return bangla
        ? "স্টাফ অ্যাকাউন্ট দিয়ে কেনাকাটা করা যায় না। কাস্টমার অ্যাকাউন্ট ব্যবহার করুন।"
        : STAFF_CANNOT_SHOP_MESSAGE;
    }

    const profile = await getOrCreateCustomerProfile(userId);
    const orders = await prisma.order.findMany({
      where: { customerProfileId: profile.id, deletedAt: null },
      include: {
        payments: {
          where: { deletedAt: null },
          select: { method: true, status: true, createdAt: true },
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
      take: ORDER_LIMIT,
    });

    if (!orders.length) {
      return bangla
        ? "আপনার কোনো অর্ডার নেই।"
        : "You have no orders yet.";
    }

    const lines = orders.map((order, index) => {
      const latestPayment = order.payments[0];
      const method = paymentLabel(latestPayment?.method, bangla);
      const unpaid = isUnpaid(order.paymentStatus);
      const date = order.createdAt.toISOString().slice(0, 10);
      const unpaidNote = unpaid
        ? bangla
          ? "আপনার পেমেন্ট সম্পন্ন হয়নি।"
          : "Your payment is not done."
        : bangla
          ? "পেমেন্ট সম্পন্ন।"
          : "Payment completed.";

      return [
        `${index + 1}. ${order.orderNumber} (${date})`,
        bangla
          ? `অর্ডার স্ট্যাটাস: ${order.status}`
          : `Order status: ${order.status}`,
        bangla
          ? `পেমেন্ট মেথড: ${method}`
          : `Payment method: ${method}`,
        bangla
          ? `পেমেন্ট স্ট্যাটাস: ${order.paymentStatus}`
          : `Payment status: ${order.paymentStatus}`,
        bangla
          ? `মোট: ${formatMoney(order.grandTotal, order.currency)}`
          : `Total: ${formatMoney(order.grandTotal, order.currency)}`,
        unpaidNote,
      ].join("\n");
    });

    const header = bangla
      ? "আপনার সাম্প্রতিক অর্ডার:"
      : "Your recent orders:";

    return [header, ...lines].join("\n\n");
  } catch (err) {
    logger.warn(`AI order history failed: ${(err as Error).message}`);
    return FALLBACK_MESSAGE;
  }
}
