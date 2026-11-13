import CheckOut from "@/features/checkout/components/CheckOut";
import { requireCustomer } from "@/lib/api/auth/server";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Complete your order securely.",
  robots: { index: false, follow: false },
};

export default async function CheckoutPage() {
  await requireCustomer();

  return (
    <main className="min-w-0">
      <CheckOut />
    </main>
  );
}
