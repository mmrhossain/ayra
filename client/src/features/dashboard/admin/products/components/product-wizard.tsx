"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useProductSave } from "@/features/dashboard/admin/products/hooks/use-product-save";
import { useProductWizardOptions } from "@/features/dashboard/admin/products/hooks/use-product-wizard-options";
import { createDetailsSchema, detailsSchema } from "@/features/dashboard/admin/products/schemas";
import type {
  DetailsValues,
  ProductDetail,
  ProductWizardProps,
  SaveKind,
  SelectedAttribute,
  VariantRow,
  WizardStep,
} from "@/features/dashboard/admin/products/types";
import {
  detailsFromProduct,
  focusFirstInvalid,
  normalizeVariantAttributes,
  slugify,
  uniqueSku,
  variantsFromProduct,
} from "@/features/dashboard/admin/products/utils";
import { ProductWizardDetails } from "./product-wizard-details";
import { ProductWizardStock } from "./product-wizard-stock";
import { ProductWizardVariants } from "./product-wizard-variants";

const STEPS: { id: WizardStep; label: string }[] = [
  { id: 1, label: "Details" },
  { id: 2, label: "Variants" },
  { id: 3, label: "Stock" },
];

function selectedFromProduct(product?: ProductDetail): SelectedAttribute[] {
  const map = new Map<string, string[]>();
  for (const variant of product?.variants ?? []) {
    for (const attr of normalizeVariantAttributes(variant)) {
      const current = map.get(attr.attributeId) ?? [];
      if (!current.includes(attr.id)) current.push(attr.id);
      map.set(attr.attributeId, current);
    }
  }
  return [...map.entries()].map(([attributeId, valueIds]) => ({
    attributeId,
    valueIds,
  }));
}

function validateVariants(rows: VariantRow[], selected: SelectedAttribute[]): VariantRow[] {
  const seen = new Map<string, number>();
  const hasSelectedAttributes = selected.length > 0;
  const defaultCount = rows.filter((row) => row.isDefault).length;
  const fallbackDefaultKey =
    defaultCount === 1 ? undefined : (rows.find((row) => row.isDefault)?.key ?? rows[0]?.key);
  return rows.map((row, index): VariantRow => {
    const next: VariantRow = {
      ...row,
      skuError: undefined,
      priceError: undefined,
      attrError: undefined,
      isDefault: fallbackDefaultKey ? row.key === fallbackDefaultKey : row.isDefault,
    };
    if (!row.sku.trim()) next.skuError = "SKU is required";
    const price = Number(row.price);
    if (!row.price.trim() || !Number.isFinite(price) || price <= 0) {
      next.priceError = "Price must be greater than 0";
    }
    const skuKey = row.sku.trim().toLowerCase();
    if (skuKey) {
      const first = seen.get(skuKey);
      if (first !== undefined) next.skuError = "SKU must be unique in this product";
      else seen.set(skuKey, index);
    }
    if (hasSelectedAttributes && row.attributeValueIds.length === 0) {
      next.attrError = "এই variant-এ কোনো attribute value link করা হয়নি";
    }
    return next;
  });
}

export function ProductWizard({ mode, product, initialStep = 1 }: ProductWizardProps) {
  const router = useRouter();
  const slugManual = useRef(mode === "edit");
  const [step, setStep] = useState<WizardStep>(initialStep);
  const [rows, setRows] = useState<VariantRow[]>(() => variantsFromProduct(product));
  const [variantsDirty, setVariantsDirty] = useState(false);
  const [selected, setSelected] = useState<SelectedAttribute[]>(() => selectedFromProduct(product));
  const [existingVariantIds] = useState(() => product?.variants.map((v) => v.id) ?? []);
  const save = useProductSave();
  const setProductId = save.setProductId;

  useEffect(() => {
    if (mode === "edit" && product) setProductId(product.id);
  }, [mode, product, setProductId]);

  const form = useForm<DetailsValues>({
    resolver: zodResolver(mode === "create" ? createDetailsSchema : detailsSchema),
    defaultValues: detailsFromProduct(product),
  });

  const { categoriesQuery, brandsQuery, attributesQuery, warehousesQuery, categories } =
    useProductWizardOptions();

  // React Compiler Safe: form.watch() এর জায়গায় useWatch হুক ব্যবহার করা হয়েছে
  const nameValue = useWatch({
    control: form.control,
    name: "name",
  });

  const slugValue = useWatch({
    control: form.control,
    name: "slug",
  });

  const priceValue = useWatch({
    control: form.control,
    name: "price",
  });

  const statusValue = useWatch({
    control: form.control,
    name: "status",
  });

  useEffect(() => {
    if (slugManual.current) return;
    form.setValue("slug", slugify(nameValue ?? ""), { shouldValidate: false });
  }, [nameValue, form]);

  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!form.formState.isDirty && !variantsDirty) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [form.formState.isDirty, variantsDirty]);

  const confirmLeave = () => {
    if (!form.formState.isDirty && !variantsDirty) return true;
    return window.confirm("Leave without saving? Unsaved changes will be lost.");
  };

  const setRowsDirty = (next: VariantRow[]) => {
    setVariantsDirty(true);
    setRows(next);
  };

  const setSelectedDirty = (next: SelectedAttribute[]) => {
    setVariantsDirty(true);
    setSelected(next);
  };

  const goList = () => {
    if (!confirmLeave()) return;
    router.push("/admin/products");
  };

  const submit = async (kind: SaveKind) => {
    if (mode === "edit" && step >= 2) {
      const checked = validateVariants(rows, selected);
      setRowsDirty(checked);
      if (checked.some((row) => row.skuError || row.priceError || row.attrError)) {
        setStep(2);
        requestAnimationFrame(focusFirstInvalid);
        return;
      }
    }

    const detailsOk = await form.trigger();
    if (!detailsOk) {
      setStep(1);
      requestAnimationFrame(focusFirstInvalid);
      return;
    }
    const details = form.getValues();
    if (mode === "edit" && kind === "save" && rows.length === 0) {
      setStep(2);
      return;
    }

    const defaultSku = uniqueSku(`${details.slug}-default`, new Set());
    const variantsToSave =
      mode === "create"
        ? [
            {
              key: rows[0]?.key ?? "default",
              id: rows[0]?.id,
              sku: rows[0]?.sku?.trim() || defaultSku,
              price: details.price,
              isDefault: true,
              attributeValueIds: [],
              label: rows[0]?.label || "Default",
              initialQty: 0,
              skuError: undefined,
              priceError: undefined,
            },
          ]
        : kind === "draft" && step === 1
          ? rows.filter((row) => row.id)
          : rows;
    const warehouseId = mode === "create" ? undefined : warehousesQuery.data?.items?.[0]?.id;
    const result = await save.run({
      mode,
      kind,
      productId: product?.id ?? save.productId ?? undefined,
      existingVariantIds,
      details,
      variants: variantsToSave,
      warehouseId,
    });
    if (!result) return;
    if (result.slugConflict) {
      form.setError("slug", { message: "Must be unique" });
      setStep(1);
      requestAnimationFrame(focusFirstInvalid);
      return;
    }
    setRows(result.variants);
    if (result.failed) return;
    form.reset(details);
    setVariantsDirty(false);
    save.finish(
      kind,
      details.status === "ACTIVE" && kind === "save" && result.variants.length > 0,
      result.variants
    );
  };

  const continueNext = async () => {
    if (step === 1) {
      const ok = await form.trigger();
      if (!ok) {
        requestAnimationFrame(focusFirstInvalid);
        return;
      }
      if (rows.length === 1 && !rows[0]?.sku) {
        const slug = form.getValues("slug");
        setRows([
          {
            ...rows[0],
            sku: slug ? `${slug}-default` : rows[0].sku,
            label: rows[0].label || "Default",
          },
        ]);
      }
      setStep(2);
      return;
    }
    if (step === 2) {
      const checked = validateVariants(rows, selected);
      setRowsDirty(checked);
      if (checked.some((row) => row.skuError || row.priceError || row.attrError)) {
        requestAnimationFrame(focusFirstInvalid);
        return;
      }
      setStep(3);
    }
  };

  const title = mode === "create" ? "New product" : (product?.name ?? "Edit product");

  return (
    <section className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="text-sm text-muted-foreground">
            {mode === "create"
              ? "Save basic info and a price. Manage variants and stock from the product list."
              : "Update details and every variant, not just the default."}
          </p>
        </div>
        <Button type="button" variant="outline" onClick={goList}>
          Back to products
        </Button>
      </div>

      {mode === "edit" ? (
        <ol className="flex flex-wrap gap-2" aria-label="Wizard steps">
          {STEPS.map((item) => {
            const active = step === item.id;
            const done = step > item.id;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  className={`rounded-full px-3 py-1.5 text-sm ${
                    active ? "bg-primary text-primary-foreground" : done ? "bg-muted" : "border"
                  }`}
                  aria-current={active ? "step" : undefined}
                  onClick={() => {
                    if (item.id < step) setStep(item.id);
                  }}
                >
                  {item.id}. {item.label}
                </button>
              </li>
            );
          })}
        </ol>
      ) : null}

      {save.productId && mode === "create" ? (
        <p className="rounded-md border p-3 text-sm">
          Product id {save.productId} is saved. Finish remaining variants, then retry if a row
          failed.
        </p>
      ) : null}
      {save.progress ? (
        <p className="text-sm text-muted-foreground" role="status">
          {save.progress}
        </p>
      ) : null}

      {categoriesQuery.isLoading ? (
        <Skeleton className="h-40 w-full" />
      ) : (
        <>
          {step === 1 ? (
            <ProductWizardDetails
              form={form}
              categories={categories}
              brands={brandsQuery.data ?? []}
              slugManual={slugManual}
              showPrice={mode === "create"}
            />
          ) : null}
          {mode === "edit" && step === 2 ? (
            <ProductWizardVariants
              productName={nameValue ?? ""}
              productSlug={slugValue ?? ""}
              basePrice={priceValue ?? ""}
              attributes={attributesQuery.data ?? []}
              selected={selected}
              onSelectedChange={setSelectedDirty}
              rows={rows}
              onRowsChange={setRowsDirty}
            />
          ) : null}
          {mode === "edit" && step === 3 ? (
            <ProductWizardStock
              rows={mode === "edit" ? rows.filter((row) => !row.id) : rows}
              onRowsChange={(next) => {
                if (mode !== "edit") {
                  setRowsDirty(next);
                  return;
                }
                const byKey = new Map(next.map((row) => [row.key, row]));
                setRowsDirty(rows.map((row) => byKey.get(row.key) ?? row));
              }}
            />
          ) : null}
        </>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
        {mode === "edit" ? (
          <Button
            type="button"
            variant="outline"
            disabled={step === 1 || save.pending}
            onClick={() => setStep((s) => (s === 1 ? 1 : ((s - 1) as WizardStep)))}
          >
            Back
          </Button>
        ) : (
          <span />
        )}
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={save.pending}
            onClick={() => submit("draft")}
          >
            {save.pending ? "Saving..." : "Save draft"}
          </Button>
          {mode === "edit" && step < 3 ? (
            <Button
              type="button"
              variant="secondary"
              disabled={save.pending}
              onClick={continueNext}
            >
              Continue
            </Button>
          ) : null}
          {mode === "create" || step >= 2 ? (
            <Button type="button" disabled={save.pending} onClick={() => submit("save")}>
              {save.pending ? "Saving..." : statusValue === "ACTIVE" ? "Publish" : "Save"}
            </Button>
          ) : null}
        </div>
      </div>
      {rows.some((row) => row.skuError) && save.productId ? (
        <Button
          type="button"
          variant="outline"
          disabled={save.pending}
          onClick={() => submit("save")}
        >
          Retry failed variants
        </Button>
      ) : null}
      <p className="text-xs text-muted-foreground">
        <Link
          href="/admin/products"
          className="underline"
          onClick={(e) => {
            if (!confirmLeave()) e.preventDefault();
          }}
        >
          Cancel
        </Link>
      </p>
    </section>
  );
}
