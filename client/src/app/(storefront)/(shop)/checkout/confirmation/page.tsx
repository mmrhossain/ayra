import PaymentResult from "@/features/checkout/components/PaymentResult";
import { requireRole } from "@/lib/api/auth/server";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

const CheckoutConfirmationPage = async () => {
  await requireRole("CUSTOMER", "ADMIN", "VENDOR");

  return (
    <Suspense>
      <PaymentResult kind="confirmation" />
    </Suspense>
  );
};

export default CheckoutConfirmationPage;
