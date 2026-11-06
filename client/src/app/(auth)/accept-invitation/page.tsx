import { Suspense } from "react";

import AcceptInvitationForm from "@/features/auth/components/AcceptInvitationForm";

export default function AcceptInvitationPage() {
  return (
    <Suspense fallback={null}>
      <AcceptInvitationForm />
    </Suspense>
  );
}
