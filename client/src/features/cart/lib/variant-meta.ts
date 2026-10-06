export type VariantMeta = {
  size?: string;
  color?: string;
};

function cleanToken(value: string): string {
  return value.replace(/[_-]+/g, " ").trim();
}

export function variantMetaFromSku(sku?: string | null): VariantMeta {
  if (!sku) return {};

  const parts = sku
    .split(/[|/]/)
    .map((part) => part.trim())
    .filter(Boolean);

  const meta: VariantMeta = {};

  for (const part of parts) {
    const labeled = part.match(/^(size|color|colour)\s*[:\-]\s*(.+)$/i);
    if (labeled) {
      const key = labeled[1].toLowerCase();
      const value = cleanToken(labeled[2]);
      if (key === "size") meta.size = value;
      else meta.color = value;
      continue;
    }
  }

  if (meta.size || meta.color) return meta;

  if (parts.length >= 2) {
    const last = cleanToken(parts[parts.length - 1]);
    const prev = cleanToken(parts[parts.length - 2]);
    if (last) meta.color = last;
    if (prev) meta.size = prev;
  }

  return meta;
}
