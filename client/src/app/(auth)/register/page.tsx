import RegistrationForm from "@/features/auth/components/RegistrationForm";
import { redirectSignedInFromAuthPage } from "@/lib/api/auth/server";
import { fetchPublishedLegal } from "@/features/content/api";
import type { PublishedLegalDocument } from "@/features/content/types";
import { Suspense } from "react";

type Props = {
  searchParams: Promise<{ redirect?: string }>;
};

export default async function RegisterPage({ searchParams }: Props) {
  const { redirect } = await searchParams;
  await redirectSignedInFromAuthPage(redirect);

  let terms: PublishedLegalDocument | null = null;
  try {
    terms = await fetchPublishedLegal("TERMS");
  } catch {
    terms = null;
  }

  return (
    <Suspense fallback={null}>
      <RegistrationForm terms={terms} />
    </Suspense>
  );
}
