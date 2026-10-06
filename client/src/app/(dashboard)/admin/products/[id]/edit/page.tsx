import Link from "next/link";
import { ProductWizard } from "@/features/dashboard/admin/products/components/product-wizard";
import type { WizardStep } from "@/features/dashboard/admin/products/types";
import {
  fetchAdminProduct,
  toErrorMessage,
} from "@/features/dashboard/admin/products/api/products";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ step?: string }>;
};

export default async function AdminEditProductPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { step: stepParam } = await searchParams;
  const parsed = Number(stepParam);
  const initialStep: WizardStep =
    parsed === 2 || parsed === 3 ? parsed : 1;

  let product;
  let error: string | null = null;
  try {
    product = await fetchAdminProduct(id);
  } catch (err) {
    error = toErrorMessage(err);
  }

  if (error || !product) {
    return (
      <section className="space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight">Edit product</h1>
        <div
          role="alert"
          className="rounded-xl border border-destructive/30 bg-destructive/5 p-6"
        >
          <h2 className="text-lg font-semibold">Could not load product</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {error ?? "Unknown error"}
          </p>
          <p className="mt-3 text-sm">
            <Link href="/admin/products" className="underline">
              Back to products
            </Link>
          </p>
        </div>
      </section>
    );
  }

  return (
    <ProductWizard mode="edit" product={product} initialStep={initialStep} />
  );
}
