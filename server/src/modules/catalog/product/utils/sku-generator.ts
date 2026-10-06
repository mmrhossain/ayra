const SKU_SAFE = /[^A-Z0-9]+/g;

export const makeSkuSegment = (value: string): string =>
  value
    .trim()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(SKU_SAFE, "-")
    .replace(/^-+|-+$/g, "");

export const generateSku = (
  productSku: string,
  attributeValues: string[] = [],
): string => {
  const base = makeSkuSegment(productSku);
  const parts = attributeValues.map(makeSkuSegment).filter(Boolean);
  const sku = [base, ...parts].filter(Boolean).join("-");
  if (!sku) {
    return "SKU";
  }
  return sku;
};

export const ensureUniqueSku = (
  sku: string,
  taken: Set<string>,
): string => {
  const normalized = makeSkuSegment(sku) || sku;
  if (!taken.has(normalized)) {
    taken.add(normalized);
    return normalized;
  }

  let index = 2;
  while (taken.has(`${normalized}-${index}`)) {
    index += 1;
  }
  const next = `${normalized}-${index}`;
  taken.add(next);
  return next;
};
