import { requireAdminPageAccess } from "@/lib/api/auth/server";
import Link from "next/link";
import { ProductWizard } from "@/features/dashboard/admin/products/components/product-wizard";
import type { WizardStep } from "@/features/dashboard/admin/products/types";
import {
  fetchAdminProduct,
  toErrorMessage,
} from "@/features/dashboard/admin/products/api/products";
import { PageError } from "@/features/dashboard/admin/shared/components/page-error";
import { PageHeader } from "@/features/dashboard/admin/shared/components/page-header";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ step?: string }>;
};

export default async function AdminEditProductPage({
  params,
  searchParams,
}: Props) {
  await requireAdminPageAccess("/admin/products");
  const { id } = await params;
  const { step: stepParam } = await searchParams;
  const parsed = Number(stepParam);
  const initialStep: WizardStep = parsed === 2 || parsed === 3 ? parsed : 1;

  let product;
  let error: string | null = null;
  try {
    product = await fetchAdminProduct(id);
  } catch (err) {
    error = toErrorMessage(err);
  }

  if (error || !product) {
    return (
      <section className="space-y-6">
        <PageHeader title="Edit product" />
        <PageError
          title="Could not load product"
          message={error ?? "Unknown error"}
          action={
            <Link href="/admin/products" className="text-sm underline">
              Back to products
            </Link>
          }
        />
      </section>
    );
  }

  return (
    <ProductWizard mode="edit" product={product} initialStep={initialStep} />
  );
}
