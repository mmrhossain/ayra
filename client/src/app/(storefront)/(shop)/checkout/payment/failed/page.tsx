import PaymentResult from "@/features/checkout/components/PaymentResult";
import { requireCustomer } from "@/lib/api/auth/server";
import { Suspense } from "react";

const PaymentFailPage = async () => {
  await requireCustomer();
  return (
    <Suspense>
      <PaymentResult kind="fail" />
    </Suspense>
  );
};

export default PaymentFailPage;
