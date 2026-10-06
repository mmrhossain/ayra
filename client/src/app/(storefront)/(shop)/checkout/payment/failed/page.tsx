import PaymentResult from "@/features/checkout/components/PaymentResult";
import { Suspense } from "react";

const PaymentFailPage = () => {
  return (
    <Suspense>
      <PaymentResult kind="fail" />
    </Suspense>
  );
};

export default PaymentFailPage;
