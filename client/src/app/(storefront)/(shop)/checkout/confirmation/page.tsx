import PaymentResult from "@/features/checkout/components/PaymentResult";
import { requireCustomer } from "@/lib/api/auth/server";
import { Suspense } from "react";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Order Confirmation",
  robots: { index: false, follow: false },
};

const CheckoutConfirmationPage = async () => {
  await requireCustomer();

  return (
    <Suspense>
      <PaymentResult kind="confirmation" />
    </Suspense>
  );
};

export default CheckoutConfirmationPage;
