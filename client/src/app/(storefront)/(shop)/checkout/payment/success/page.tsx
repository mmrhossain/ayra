import PaymentResult from "@/features/checkout/components/PaymentResult";
import { Suspense } from "react";

const PaymentSuccessPage = () => {
  return (
    <Suspense>
      <PaymentResult kind="success" />
    </Suspense>
  );
};

export default PaymentSuccessPage;
