import PaymentResult from "@/features/checkout/components/PaymentResult";
import { requireCustomer } from "@/lib/api/auth/server";
import { Suspense } from "react";

const PaymentSuccessPage = async () => {
  await requireCustomer();
  return (
    <Suspense>
      <PaymentResult kind="success" />
    </Suspense>
  );
};

export default PaymentSuccessPage;
