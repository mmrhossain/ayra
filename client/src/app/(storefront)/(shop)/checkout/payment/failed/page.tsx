import PaymentResult, { PaymentResultSkeleton } from "@/features/checkout/components/PaymentResult";
import { requireCustomer } from "@/lib/api/auth/server";
import { Suspense } from "react";

export const metadata = {
  title: "Payment Failed",
  robots: { index: false, follow: false },
};

const PaymentFailPage = async () => {
  await requireCustomer();
  return (
    <Suspense fallback={<PaymentResultSkeleton />}>
      <PaymentResult kind="fail" />
    </Suspense>
  );
};

export default PaymentFailPage;
