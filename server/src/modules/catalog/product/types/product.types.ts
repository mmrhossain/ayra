import type { z } from "zod";
import type { ProductStatus } from "../../../../generated/prisma/client.ts";
import type {
  createProductSchema,
  createVariantSchema,
  listProductsQuerySchema,
  nestedCreateVariantSchema,
  updateProductSchema,
  updateVariantSchema,
  variantDefaultsSchema,
  variantOptionGroupSchema,
  variantOverrideSchema,
} from "../validators/product.validators.ts";

export type { ProductStatus };

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type CreateVariantInput = z.infer<typeof createVariantSchema>;
export type NestedCreateVariantInput = z.infer<typeof nestedCreateVariantSchema>;
export type UpdateVariantInput = z.infer<typeof updateVariantSchema>;
export type ListProductsQuery = z.infer<typeof listProductsQuerySchema>;

export type ProductImageInput = NonNullable<CreateProductInput["images"]>[number];
export type VariantImageInput = NonNullable<CreateVariantInput["images"]>[number];

export type VariantOptionGroupInput = z.infer<typeof variantOptionGroupSchema>;
export type VariantDefaultsInput = z.infer<typeof variantDefaultsSchema>;
export type VariantOverrideInput = z.infer<typeof variantOverrideSchema>;

export type ImageRef = {
  publicId?: string | null | undefined;
  imageUrl?: string | null | undefined;
};

export type CreateProductPayload = CreateProductInput;

export type UpdateVariantPayload = UpdateVariantInput & {
  id?: string | undefined;
};

export type UpdateProductPayload = UpdateProductInput;

export type ProductImageRow = {
  imageUrl: string;
  publicId: string | null;
  isPrimary: boolean;
  sortOrder?: number;
  altText?: string | null;
  productId: string;
  variantId?: string;
};

export type GeneratedVariantSpec = {
  sku: string;
  barcode?: string;
  price: number;
  compareAtPrice?: number;
  costPrice?: number;
  weight?: number;
  isDefault: boolean;
  attributeValueIds: string[];
  labels: string[];
  images?: VariantImageInput[];
};

export type VariantMatrixRow = {
  sku: string;
  barcode: string | null;
  price: number;
  compareAtPrice: number | null;
  costPrice: number | null;
  weight: number | null;
  isDefault: boolean;
  attributeValueIds: string[];
  attributes: Array<{ id: string; value: string }>;
  images: VariantImageInput[];
};

export const resolveProductStatus = (
  status: ProductStatus | undefined,
  fallback: ProductStatus = "DRAFT",
): ProductStatus => {
  return status ?? fallback;
};
