import { AppError } from "../../../../common/errors/AppError.ts";

export const DEFAULT_BRAND_PREFIX =
  (typeof process !== "undefined" && process.env.DEFAULT_BRAND_PREFIX?.trim()) ||
  "AYR";

export const MAX_SKU_LENGTH = 40;
export const MAX_GENERATED_SKU_RETRIES = 20;

const TYPED_SKU_PATTERN = /^(?!-)(?!.*--)[A-Za-z0-9-]+(?<!-)$/;

export type SkuAttributeInput = {
  attributeId: string;
  attributeName: string;
  value: string;
};

const STYLE_CODES: Record<string, string> = {
  tshirt: "TSH",
  tshirts: "TSH",
  tee: "TSH",
  tees: "TSH",
  shirt: "SHT",
  shirts: "SHT",
  short: "SRT",
  shorts: "SRT",
  pant: "PNT",
  pants: "PNT",
  trouser: "PNT",
  trousers: "PNT",
  jean: "JNS",
  jeans: "JNS",
  hoodie: "HDI",
  hoodies: "HDI",
  jacket: "JKT",
  jackets: "JKT",
  dress: "DRS",
  dresses: "DRS",
};

const COLOR_CODES: Record<string, string> = {
  black: "BLK",
  white: "WHT",
  navy: "NAV",
  red: "RED",
  blue: "BLU",
  green: "GRN",
  gray: "GRY",
  grey: "GRY",
  yellow: "YLW",
  pink: "PNK",
  orange: "ORG",
  brown: "BRN",
  beige: "BGE",
  purple: "PRP",
};

const SIZE_CODES: Record<string, string> = {
  xs: "XS",
  s: "S",
  m: "M",
  l: "L",
  xl: "XL",
  xxl: "XXL",
  xxxl: "XXXL",
  "2xl": "XXL",
  "3xl": "XXXL",
  os: "OS",
  small: "S",
  medium: "M",
  large: "L",
  "extra-small": "XS",
  "extra-large": "XL",
  "one-size": "OS",
  onesize: "OS",
};

const normalizeKey = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");

const alnumUpper = (value: string): string =>
  value
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "");

export const makeSkuSegment = (value: string): string => alnumUpper(value);

const consonantMnemonic = (value: string, length = 3): string => {
  const alnum = alnumUpper(value);
  const seen = new Set<string>();
  const chars: string[] = [];
  for (const ch of alnum) {
    if (!"AEIOU".includes(ch) && !seen.has(ch)) {
      seen.add(ch);
      chars.push(ch);
      if (chars.length === length) return chars.join("");
    }
  }
  for (const ch of alnum) {
    if (chars.length === length) break;
    chars.push(ch);
  }
  return chars.join("");
};

const firstAlnum = (value: string, length = 3): string =>
  alnumUpper(value).slice(0, length);

export const brandCode = (brandName?: string | null): string => {
  const code = firstAlnum(brandName ?? "");
  return code || DEFAULT_BRAND_PREFIX;
};

export const styleCode = (categoryName: string): string => {
  const key = normalizeKey(categoryName);
  if (STYLE_CODES[key]) return STYLE_CODES[key] as string;
  const hyphenated = categoryName
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-");
  if (hyphenated.includes("t-shirt") || hyphenated.includes("tee")) return "TSH";
  return consonantMnemonic(categoryName) || "GEN";
};

export const colorCode = (value: string): string => {
  const mapped = COLOR_CODES[normalizeKey(value)];
  if (mapped) return mapped;
  return firstAlnum(value) || "CLR";
};

export const sizeCode = (value: string): string => {
  const trimmed = value.trim();
  if (/^\d+[A-Z]?$/i.test(trimmed)) return trimmed.toUpperCase();
  const mapped = SIZE_CODES[normalizeKey(value)];
  if (mapped) return mapped;
  return firstAlnum(value) || "SZ";
};

export const otherValueCode = (value: string): string =>
  firstAlnum(value) || "VAL";

const attributeRank = (name: string): number => {
  if (/colour|color/i.test(name)) return 0;
  if (/size/i.test(name)) return 1;
  return 2;
};

export const sortSkuAttributes = (
  attributes: SkuAttributeInput[],
): SkuAttributeInput[] =>
  [...attributes].sort((a, b) => {
    const rank = attributeRank(a.attributeName) - attributeRank(b.attributeName);
    if (rank !== 0) return rank;
    const name = a.attributeName.localeCompare(b.attributeName, undefined, {
      sensitivity: "accent",
    });
    if (name !== 0) return name;
    return a.attributeId.localeCompare(b.attributeId);
  });

const valueCodeFor = (attributeName: string, value: string): string => {
  if (/colour|color/i.test(attributeName)) return colorCode(value);
  if (/size/i.test(attributeName)) return sizeCode(value);
  return otherValueCode(value);
};

export const buildSuggestedSku = (input: {
  brandName?: string | null | undefined;
  categoryName: string;
  attributes?: SkuAttributeInput[] | undefined;
}): string => {
  if (!input.categoryName?.trim()) {
    throw new AppError("Category is required to generate a SKU", 400);
  }
  const parts = [
    brandCode(input.brandName),
    styleCode(input.categoryName),
    ...sortSkuAttributes(input.attributes ?? []).map((attr) =>
      valueCodeFor(attr.attributeName, attr.value),
    ),
  ].filter(Boolean);
  return parts.join("-");
};

export const isBlankSku = (sku?: string | null): boolean =>
  sku == null || sku.trim() === "";

export const assertTypedSku = (sku: string): void => {
  if (sku !== sku.trim()) {
    throw new AppError("Invalid SKU", 400);
  }
  if (!sku) {
    throw new AppError("Invalid SKU", 400);
  }
  if (sku.length > MAX_SKU_LENGTH) {
    throw new AppError("Invalid SKU", 400);
  }
  if (!TYPED_SKU_PATTERN.test(sku)) {
    throw new AppError("Invalid SKU", 400);
  }
};

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
  const key = sku.toLowerCase();
  if (!taken.has(key)) {
    taken.add(key);
    return sku;
  }

  let index = 2;
  while (taken.has(`${key}-${index}`)) {
    index += 1;
  }
  const next = `${sku}-${index}`;
  taken.add(next.toLowerCase());
  return next;
};
