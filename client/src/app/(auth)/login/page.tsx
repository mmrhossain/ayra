import LoginForm from "@/features/auth/components/LoginForm";
import { redirectSignedInFromAuthPage } from "@/lib/api/auth/server";
import { Suspense } from "react";

type Props = {
  searchParams: Promise<{ redirect?: string }>;
};

export default async function LoginPage({ searchParams }: Props) {
  const { redirect } = await searchParams;
  await redirectSignedInFromAuthPage(redirect);

  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
