import CheckOut from "@/features/checkout/components/CheckOut";
import { requireCustomer } from "@/lib/api/auth/server";

export const metadata = {
  title: "Checkout | Your Store",
  description: "Complete your order securely",
};

export default async function CheckoutPage() {
  await requireCustomer();

  return (
    <main className="min-w-0">
      <CheckOut />
    </main>
  );
}
