import type { ProductDetail, ProductListItem, ProductListResult } from "./models";

export type {
  Envelope,
  ProductListItem,
  ProductImageAsset,
  ProductVariantAttribute,
  ProductVariant,
  NormalizedVariantAttribute,
  ProductDetail,
  ProductPagination,
  ProductListResult,
  ProductSort,
  ProductListParams,
  CatalogOption,
  ProductImageInput,
  CreateProductBody,
  CreateVariantBody,
} from "./models";

export type { DetailsFormValues as DetailsValues } from "@/features/dashboard/admin/products/schemas";

export type ProductDeleteDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: ProductListItem | null;
};

export type ProductTableProps = {
  initialData: ProductListResult;
};

export type WizardMode = "create" | "edit";

export type WizardStep = 1 | 2 | 3;

export type SaveKind = "draft" | "save";

export type VariantRow = {
  key: string;
  id?: string;
  sku: string;
  price: string;
  isDefault: boolean;
  attributeValueIds: string[];
  label: string;
  skuError?: string;
  priceError?: string;
  attrError?: string;
  initialQty: number;
};

export type SelectedAttribute = {
  attributeId: string;
  valueIds: string[];
};

export type ProductWizardProps = {
  mode: WizardMode;
  product?: ProductDetail;
  initialStep?: WizardStep;
};
