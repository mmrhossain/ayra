export type { AuthRole } from "../../common/types/auth.ts";

export const IMAGE_TYPE_VALUES = [
  "product",
  "category",
  "slider",
  "blog",
  "customer_avatar",
  "vendor_avatar",
] as const;

export type ImageType = (typeof IMAGE_TYPE_VALUES)[number];

export type UploadedImage = {
  publicId: string;
  url: string;
  secure_url: string;
  variants: string[];
};

export type ImageVariant = {
  width: number;
  height: number;
  crop: "fill" | "auto" | "fit" | "limit";
  gravity?: "auto" | "center" | "face";
};

export type UploadPreset = {
  folder: string;
  masterMax: number;
  variants: ImageVariant[];
  maxFiles: number;
  allowMultiple: boolean;
};

export type ImageFile = {
  path: string;
  mimetype: string;
  originalname: string;
  size: number;
};

export type MediaOwner =
  | "product"
  | "product_variant"
  | "category"
  | "slider"
  | "blog"
  | "vendor_profile"
  | "brand"
  | "user";

export type SingleUploadQuery = {
  type: ImageType;
};

export type MultipleUploadQuery = {
  type: "product";
};

export type MediaLibraryItem = UploadedImage & {
  type: ImageType;
  status: "PENDING" | "ATTACHED";
  createdAt: Date;
};

export type ListMediaQuery = {
  type: ImageType;
  page: number;
  limit: number;
};
