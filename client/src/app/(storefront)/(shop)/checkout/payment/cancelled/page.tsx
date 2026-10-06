import PaymentResult from "@/features/checkout/components/PaymentResult";
import { Suspense } from "react";

const PaymentCancelPage = () => {
  return (
    <Suspense>
      <PaymentResult kind="cancel" />
    </Suspense>
  );
};

export default PaymentCancelPage;
