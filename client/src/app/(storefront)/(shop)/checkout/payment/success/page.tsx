import PaymentResult, { PaymentResultSkeleton } from "@/features/checkout/components/PaymentResult";
import { requireCustomer } from "@/lib/api/auth/server";
import { Suspense } from "react";

export const metadata = {
  title: "Payment Successful",
  robots: { index: false, follow: false },
};

const PaymentSuccessPage = async () => {
  await requireCustomer();
  return (
    <Suspense fallback={<PaymentResultSkeleton />}>
      <PaymentResult kind="success" />
    </Suspense>
  );
};

export default PaymentSuccessPage;
