import { dashboardApi, DashboardApiError } from "@/lib/api/dashboard";

export type Envelope<T> = {
  success: true;
  message: string;
  data: T;
};

export type ImageType =
  | "product"
  | "category"
  | "slider"
  | "blog"
  | "customer_avatar"
  | "vendor_avatar";

export type UploadedImage = {
  publicId: string;
  url: string;
  secure_url: string;
  variants: string[];
};

export type MediaLibraryItem = UploadedImage & {
  type: ImageType;
  status: "PENDING" | "ATTACHED";
  createdAt: string;
};

export type MediaLibraryResult = {
  items: MediaLibraryItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

const FOLDER_TO_TYPE: Record<string, ImageType> = {
  products: "product",
  product: "product",
  categories: "category",
  category: "category",
  profiles: "customer_avatar",
  profile: "customer_avatar",
  customer_avatar: "customer_avatar",
  vendor_avatar: "vendor_avatar",
  slider: "slider",
  sliders: "slider",
  slider_mobile: "slider",
  blog: "blog",
  blogs: "blog",
};

export function resolveImageType(folder: string): ImageType {
  return FOLDER_TO_TYPE[folder] ?? "product";
}

export async function uploadImage(
  file: File,
  type: ImageType
): Promise<UploadedImage> {
  const body = new FormData();
  body.append("image", file);
  body.append("type", type);
  const res = await dashboardApi.post<Envelope<UploadedImage>>(
    "/media/upload",
    { body, params: { type } }
  );
  return res.data;
}

export async function uploadImages(
  files: File[],
  type: "product" = "product"
): Promise<UploadedImage[]> {
  const body = new FormData();
  for (const file of files) body.append("images", file);
  body.append("type", type);
  const res = await dashboardApi.post<Envelope<UploadedImage[]>>(
    "/media/uploads",
    { body, params: { type } }
  );
  return res.data;
}

export async function listMediaLibrary(
  type: ImageType,
  page = 1,
  limit = 24
): Promise<MediaLibraryResult> {
  const res = await dashboardApi.get<Envelope<MediaLibraryResult>>("/media", {
    params: { type, page, limit },
  });
  return res.data;
}

export function toUploadErrorMessage(err: unknown): string {
  if (err instanceof DashboardApiError) return err.message;
  if (err instanceof Error) return err.message;
  return "Image upload failed";
}
