import PaymentResult from "@/features/checkout/components/PaymentResult";
import { requireCustomer } from "@/lib/api/auth/server";
import { Suspense } from "react";

export const metadata = {
  title: "Payment Cancelled",
  robots: { index: false, follow: false },
};

const PaymentCancelPage = async () => {
  await requireCustomer();
  return (
    <Suspense>
      <PaymentResult kind="cancel" />
    </Suspense>
  );
};

export default PaymentCancelPage;
