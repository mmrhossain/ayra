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
  ProductStatus,
  BulkProductAction,
  BulkProductResult,
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
  skuEdited?: boolean;
  lastSuggested?: string;
  price: string;
  costPrice: string;
  isDefault: boolean;
  attributeValueIds: string[];
  label: string;
  skuError?: string;
  priceError?: string;
  costError?: string;
  attrError?: string;
  initialQty: string;
  /** Current stock carried from the loaded product, used to diff the entered level. */
  existingQty?: number;
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
