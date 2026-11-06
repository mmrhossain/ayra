"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NumberInput } from "@/components/ui/number-input";
import type { AttributeListItem } from "@/features/dashboard/admin/attributes/api/attributes";
import type { SelectedAttribute, VariantRow } from "@/features/dashboard/admin/products/types";
import { cartesian, comboKey } from "@/features/dashboard/admin/products/utils";
import {
  buildSuggestedSku,
  ensureUniqueSku,
  typedSkuError,
  type SkuAttributeInput,
} from "@/features/dashboard/admin/products/utils/sku-generator";

type Props = {
  categoryName: string;
  brandName?: string | null;
  basePrice?: string;
  attributes: AttributeListItem[];
  selected: SelectedAttribute[];
  onSelectedChange: (next: SelectedAttribute[]) => void;
  rows: VariantRow[];
  onRowsChange: (next: VariantRow[]) => void;
};

function skuAttributesForCombo(
  combo: Array<{ id: string; value: string; attributeName: string; attributeId: string }>,
): SkuAttributeInput[] {
  return combo.map((item) => ({
    attributeId: item.attributeId,
    attributeName: item.attributeName,
    value: item.value,
  }));
}

function shouldKeepSku(row: VariantRow | undefined, suggested: string): boolean {
  if (!row) return false;
  if (row.skuEdited) return true;
  if (row.lastSuggested && row.sku === row.lastSuggested) return false;
  if (row.sku && row.sku !== suggested) return true;
  return false;
}

function defaultPriceOf(rows: VariantRow[], fallback = ""): string {
  return rows.find((row) => row.isDefault)?.price || rows[0]?.price || fallback;
}

function buildVariantRows(
  selected: SelectedAttribute[],
  attributes: AttributeListItem[],
  rows: VariantRow[],
  categoryName: string,
  brandName?: string | null,
  basePrice = "",
): VariantRow[] {
  const groups = selected
    .map((s) => {
      const attr = attributes.find((a) => a.id === s.attributeId);
      if (!attr) return [];
      return s.valueIds
        .map((id) => attr.values.find((v) => v.id === id))
        .filter((v): v is NonNullable<typeof v> => Boolean(v))
        .map((v) => ({
          id: v.id,
          value: v.value,
          attributeName: attr.name,
          attributeId: attr.id,
        }));
    })
    .filter((g) => g.length > 0);

  if (groups.length === 0) {
    const suggested = categoryName
      ? buildSuggestedSku({ brandName, categoryName, attributes: [] })
      : "";
    const prev = rows[0];
    const keep = shouldKeepSku(prev, suggested);
    return [
      {
        key: "default",
        id: prev?.id,
        sku: keep ? prev?.sku ?? "" : suggested,
        skuEdited: keep ? Boolean(prev?.skuEdited) : false,
        lastSuggested: suggested,
        price: prev?.price || basePrice,
        costPrice: prev?.costPrice ?? "",
        isDefault: true,
        attributeValueIds: [],
        label: "Default",
        initialQty: prev?.initialQty ?? "",
        existingQty: prev?.existingQty ?? 0,
        attrError: selected.length ? "এই variant-এ কোনো attribute value link করা হয়নি" : undefined,
      },
    ];
  }

  const combos = cartesian(groups);
  const existingByKey = new Map(rows.map((row) => [comboKey(row.attributeValueIds), row]));
  const previousDefault = rows.find((row) => row.isDefault);
  // A simple product starts as a single variant (usually the no-attribute
  // default). When the admin adds or changes options no combination can match
  // that lone row by attribute key, so adopt its identity for the first
  // combination: the server then updates the existing variant (keeping its
  // stock) instead of creating a sibling and orphaning it.
  const adoptDefault =
    rows.length === 1 ? (previousDefault ?? rows[0]) : undefined;
  const taken = new Set<string>();

  const next: VariantRow[] = combos.map((combo, index) => {
    const ids = combo.map((c) => c.id);
    const key = comboKey(ids);
    const prev = existingByKey.get(key) ?? (index === 0 ? adoptDefault : undefined);
    const label = combo.map((c) => c.value).join(" / ");
    const candidate = categoryName
      ? buildSuggestedSku({
          brandName,
          categoryName,
          attributes: skuAttributesForCombo(combo),
        })
      : "";
    const keep = shouldKeepSku(prev, candidate);
    const sku = keep && prev?.sku
      ? prev.sku
      : candidate
        ? ensureUniqueSku(candidate, taken)
        : "";
    if (sku) taken.add(sku.toLowerCase());

    return {
      key,
      id: prev?.id,
      sku,
      skuEdited: keep ? Boolean(prev?.skuEdited) : false,
      lastSuggested: candidate,
      price: prev?.price || basePrice,
      costPrice: prev?.costPrice ?? "",
      isDefault: previousDefault
        ? previousDefault.key === key || comboKey(previousDefault.attributeValueIds) === key
        : index === 0,
      attributeValueIds: ids,
      label,
      initialQty: prev?.initialQty ?? "",
      existingQty: prev?.existingQty ?? 0,
      skuError: prev?.skuError,
      priceError: prev?.priceError,
      attrError: undefined,
    };
  });

  if (!next.some((row) => row.isDefault) && next[0]) {
    next[0].isDefault = true;
  }

  return next;
}

export function ProductWizardVariants({
  categoryName,
  brandName,
  basePrice = "",
  attributes,
  selected,
  onSelectedChange,
  rows,
  onRowsChange,
}: Props) {
  const selectedIds = useMemo(() => new Set(selected.map((s) => s.attributeId)), [selected]);
  const skuContext = `${brandName ?? ""}|${categoryName}`;
  const previousSkuContext = useRef("");

  useEffect(() => {
    if (previousSkuContext.current === skuContext) return;
    previousSkuContext.current = skuContext;
    onRowsChange(
      buildVariantRows(
        selected,
        attributes,
        rows,
        categoryName,
        brandName,
        defaultPriceOf(rows, basePrice),
      ),
    );
    // Rebuild only when the SKU context changes; including the row/attribute
    // props here would overwrite edits after every parent render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skuContext]);

  // Helper function to sync and update parent state easily
  const updateAndSyncRows = (nextSelected: SelectedAttribute[]) => {
    onSelectedChange(nextSelected);
    const newRows = buildVariantRows(
      nextSelected,
      attributes,
      rows,
      categoryName,
      brandName,
      defaultPriceOf(rows, basePrice),
    );
    onRowsChange(newRows);
  };

  const toggleAttribute = (attributeId: string, on: boolean) => {
    const nextSelected = on
      ? [...selected, { attributeId, valueIds: [] }]
      : selected.filter((s) => s.attributeId !== attributeId);

    updateAndSyncRows(nextSelected);
  };

  const toggleValue = (attributeId: string, valueId: string, on: boolean) => {
    const nextSelected = selected.map((s) => {
      if (s.attributeId !== attributeId) return s;
      const valueIds = on ? [...s.valueIds, valueId] : s.valueIds.filter((id) => id !== valueId);
      return { ...s, valueIds };
    });

    updateAndSyncRows(nextSelected);
  };

  const generate = () => {
    onRowsChange(
      buildVariantRows(
        selected,
        attributes,
        rows,
        categoryName,
        brandName,
        defaultPriceOf(rows, basePrice),
      ),
    );
  };

  const updateRow = (key: string, patch: Partial<VariantRow>) => {
    onRowsChange(rows.map((row) => (row.key === key ? { ...row, ...patch } : row)));
  };

  const setDefault = (key: string) => {
    onRowsChange(rows.map((row) => ({ ...row, isDefault: row.key === key })));
  };

  const noOptions = selected.length === 0;
  const needsValues = selected.length > 0 && selected.every((s) => s.valueIds.length === 0);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-sm font-medium">Options</p>
        <p className="text-sm text-muted-foreground">
          Pick Size, Color, and other attributes. Combinations update as you check values.{" "}
          <Link href="/admin/attributes" className="underline">
            Manage attributes
          </Link>
        </p>
        {attributes.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No attributes yet. Add Size or Color first, then return here.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {attributes.map((attr) => (
              <label
                key={attr.id}
                className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm cursor-pointer"
              >
                <Checkbox
                  checked={selectedIds.has(attr.id)}
                  onCheckedChange={(checked) => toggleAttribute(attr.id, checked === true)}
                  aria-label={attr.name}
                />
                {attr.name}
              </label>
            ))}
          </div>
        )}
      </div>

      {selected.map((s) => {
        const attr = attributes.find((a) => a.id === s.attributeId);
        if (!attr) return null;
        return (
          <div key={s.attributeId} className="space-y-2">
            <p className="text-sm font-medium">{attr.name} values</p>
            <div className="flex flex-wrap gap-2">
              {attr.values.map((value) => (
                <label
                  key={value.id}
                  className="inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm cursor-pointer"
                >
                  <Checkbox
                    checked={s.valueIds.includes(value.id)}
                    onCheckedChange={(checked) =>
                      toggleValue(s.attributeId, value.id, checked === true)
                    }
                    aria-label={value.value}
                  />
                  {value.value}
                </label>
              ))}
            </div>
          </div>
        );
      })}

      {needsValues ? (
        <p className="text-sm text-destructive" role="alert" data-invalid="true">
          এই variant-এ কোনো attribute value link করা হয়নি
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" variant="outline" onClick={generate}>
          {noOptions ? "Use simple product" : "Refresh combinations"}
        </Button>
        <p className="text-sm text-muted-foreground">
          {noOptions
            ? "No options creates one default variant."
            : "Each checked value combination becomes a SKU."}
        </p>
      </div>

      {rows.length > 0 ? (
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full min-w-[44rem] text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="p-3 font-medium">Variant</th>
                <th className="p-3 font-medium">
                  SKU <span className="text-destructive">*</span>
                </th>
                <th className="p-3 font-medium">
                  Selling price <span className="text-destructive">*</span>
                </th>
                <th className="p-3 font-medium">Buying cost / unit</th>
                <th className="p-3 font-medium">Default</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.key} className="border-b last:border-0">
                  <td className="p-3">
                    {row.label}
                    {row.attrError ? (
                      <p className="mt-1 text-sm leading-snug text-destructive" data-invalid="true">
                        {row.attrError}
                      </p>
                    ) : null}
                  </td>
                  <td className="p-3">
                    <Input
                      value={row.sku}
                      onChange={(e) =>
                        updateRow(row.key, {
                          sku: e.target.value,
                          skuEdited: true,
                          skuError: e.target.value.trim()
                            ? typedSkuError(e.target.value)
                            : undefined,
                        })
                      }
                      aria-label={`SKU for ${row.label}`}
                      aria-invalid={Boolean(row.skuError)}
                    />
                    {row.skuError ? (
                      <p className="mt-1 text-sm leading-snug text-destructive">{row.skuError}</p>
                    ) : (
                      <p className="mt-1 text-xs text-muted-foreground">Must be unique.</p>
                    )}
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">BDT</span>
                      <NumberInput
                        decimal
                        placeholder="Amount"
                        value={row.price === "" ? null : Number(row.price)}
                        onChange={(value) =>
                          updateRow(row.key, {
                            price: value === null ? "" : String(value),
                            priceError: undefined,
                          })
                        }
                        aria-label={`Price for ${row.label}`}
                        aria-invalid={Boolean(row.priceError)}
                        className="w-36"
                      />
                    </div>
                    {row.priceError ? (
                      <p className="mt-1 text-sm leading-snug text-destructive">{row.priceError}</p>
                    ) : null}
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">BDT</span>
                      <NumberInput
                        decimal
                        placeholder="Optional"
                        value={
                          row.costPrice === "" ? null : Number(row.costPrice)
                        }
                        onChange={(value) =>
                          updateRow(row.key, {
                            costPrice: value === null ? "" : String(value),
                            costError: undefined,
                          })
                        }
                        aria-label={`Buying cost for ${row.label}`}
                        aria-invalid={Boolean(row.costError)}
                        className="w-36"
                      />
                    </div>
                    {row.costError ? (
                      <p className="mt-1 text-sm leading-snug text-destructive">
                        {row.costError}
                      </p>
                    ) : row.costPrice.trim() &&
                      row.price.trim() &&
                      Number(row.costPrice) > Number(row.price) ? (
                      <p className="mt-1 text-xs text-amber-600">
                        Buying cost is above the selling price.
                      </p>
                    ) : (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Blank means unknown, not zero.
                      </p>
                    )}
                  </td>
                  <td className="p-3">
                    <Label className="inline-flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="default-variant"
                        checked={row.isDefault}
                        onChange={() => setDefault(row.key)}
                      />
                      Default
                    </Label>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
