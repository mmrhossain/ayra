import CheckOut from "@/features/checkout/components/CheckOut";

export const metadata = {
  title: "Checkout | Your Store",
  description: "Complete your order securely",
};

export default function CheckoutPage() {
  return (
    <main className="container py-8">
      <CheckOut />
    </main>
  );
}
