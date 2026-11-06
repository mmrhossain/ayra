import type { z } from "zod";
import type {
  createCategorySchema,
  listAdminCategoriesQuerySchema,
  updateCategorySchema,
} from "./validators/category.validators.ts";

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type ListAdminCategoriesQuery = z.infer<typeof listAdminCategoriesQuerySchema>;

export type CategoryRecord = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  imagePublicId: string | null;
  mobileImage: string | null;
  mobileImagePublicId: string | null;
  isActive: boolean;
  parentId: string | null;
  createdAt: Date;
};

export type CategoryBranch = CategoryRecord & {
  parentSlug: string | null;
  path: string;
  children: CategoryBranch[];
};

export type CategoryNode = {
  parentSlug: string | null;
  path: string;
  mobileImage?: string;
  productsCount?: number;
  children: CategoryNode[];
};
