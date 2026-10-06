"use client";

import Link from "next/link";
import { useMemo } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AttributeListItem } from "@/features/dashboard/admin/attributes/api/attributes";
import type { SelectedAttribute, VariantRow } from "@/features/dashboard/admin/products/types";
import { cartesian, comboKey, slugify, uniqueSku } from "@/features/dashboard/admin/products/utils";

type Props = {
  productName: string;
  productSlug: string;
  basePrice?: string;
  attributes: AttributeListItem[];
  selected: SelectedAttribute[];
  onSelectedChange: (next: SelectedAttribute[]) => void;
  rows: VariantRow[];
  onRowsChange: (next: VariantRow[]) => void;
};

function buildVariantRows(
  selected: SelectedAttribute[],
  attributes: AttributeListItem[],
  rows: VariantRow[],
  productName: string,
  productSlug: string,
  basePrice = ""
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
        }));
    })
    .filter((g) => g.length > 0);

  if (groups.length === 0) {
    const sku = rows[0]?.sku || `${productSlug || slugify(productName) || "product"}-default`;
    return [
      {
        key: "default",
        id: rows[0]?.id,
        sku,
        price: rows[0]?.price || basePrice,
        isDefault: true,
        attributeValueIds: [],
        label: "Default",
        initialQty: rows[0]?.initialQty ?? 0,
        attrError: selected.length ? "এই variant-এ কোনো attribute value link করা হয়নি" : undefined,
      },
    ];
  }

  const combos = cartesian(groups);
  const existingByKey = new Map(rows.map((row) => [comboKey(row.attributeValueIds), row]));
  const previousDefault = rows.find((row) => row.isDefault);
  const taken = new Set<string>();

  const next: VariantRow[] = combos.map((combo, index) => {
    const ids = combo.map((c) => c.id);
    const key = comboKey(ids);
    const prev = existingByKey.get(key);
    const label = combo.map((c) => c.value).join(" / ");
    const suggested = uniqueSku(
      [productSlug || slugify(productName), ...combo.map((c) => c.value)].join("-"),
      taken
    );
    taken.add(prev?.sku ?? suggested);

    return {
      key,
      id: prev?.id,
      sku: prev?.sku ?? suggested,
      price: prev?.price || basePrice,
      isDefault: previousDefault
        ? previousDefault.key === key || comboKey(previousDefault.attributeValueIds) === key
        : index === 0,
      attributeValueIds: ids,
      label,
      initialQty: prev?.initialQty ?? 0,
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
  productName,
  productSlug,
  basePrice = "",
  attributes,
  selected,
  onSelectedChange,
  rows,
  onRowsChange,
}: Props) {
  // Memoized lookup for performance optimization
  const selectedIds = useMemo(() => new Set(selected.map((s) => s.attributeId)), [selected]);

  // Helper function to sync and update parent state easily
  const updateAndSyncRows = (nextSelected: SelectedAttribute[]) => {
    onSelectedChange(nextSelected);
    const newRows = buildVariantRows(
      nextSelected,
      attributes,
      rows,
      productName,
      productSlug,
      basePrice
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
    onRowsChange(buildVariantRows(selected, attributes, rows, productName, productSlug, basePrice));
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
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="p-3 font-medium">Variant</th>
                <th className="p-3 font-medium">
                  SKU <span className="text-destructive">*</span>
                </th>
                <th className="p-3 font-medium">
                  Price <span className="text-destructive">*</span>
                </th>
                <th className="p-3 font-medium">Default</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.key} className="border-b last:border-0">
                  <td className="p-3">
                    {row.label}
                    {row.attrError ? (
                      <p className="mt-1 text-xs text-destructive" data-invalid="true">
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
                          skuError: undefined,
                        })
                      }
                      aria-label={`SKU for ${row.label}`}
                      aria-invalid={Boolean(row.skuError)}
                    />
                    {row.skuError ? (
                      <p className="mt-1 text-xs text-destructive">{row.skuError}</p>
                    ) : (
                      <p className="mt-1 text-xs text-muted-foreground">Must be unique.</p>
                    )}
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">BDT</span>
                      <Input
                        type="number"
                        inputMode="decimal"
                        min="0"
                        step="0.01"
                        value={row.price}
                        onChange={(e) =>
                          updateRow(row.key, {
                            price: e.target.value,
                            priceError: undefined,
                          })
                        }
                        aria-label={`Price for ${row.label}`}
                        aria-invalid={Boolean(row.priceError)}
                      />
                    </div>
                    {row.priceError ? (
                      <p className="mt-1 text-xs text-destructive">{row.priceError}</p>
                    ) : null}
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
