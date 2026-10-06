import { Suspense } from "react";

import RegistrationForm from "@/features/auth/components/RegistrationForm";

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegistrationForm />
    </Suspense>
  );
}
