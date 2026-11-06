import RegistrationForm from "@/features/auth/components/RegistrationForm";
import { redirectSignedInFromAuthPage } from "@/lib/api/auth/server";
import { Suspense } from "react";

type Props = {
  searchParams: Promise<{ redirect?: string }>;
};

export default async function RegisterPage({ searchParams }: Props) {
  const { redirect } = await searchParams;
  await redirectSignedInFromAuthPage(redirect);

  return (
    <Suspense fallback={null}>
      <RegistrationForm />
    </Suspense>
  );
}
