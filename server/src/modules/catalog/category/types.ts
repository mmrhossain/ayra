import type { z } from "zod";
import type {
  createCategorySchema,
  listAdminCategoriesQuerySchema,
  updateCategorySchema,
} from "./validators/category.validators.ts";

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type ListAdminCategoriesQuery = z.infer<
  typeof listAdminCategoriesQuerySchema
>;

export type CategoryRecord = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  imagePublicId: string | null;
  isActive: boolean;
  parentId: string | null;
  createdAt: Date;
  products?: unknown[];
};

export type CategoryBranch = CategoryRecord & {
  parentSlug: string | null;
  children: CategoryBranch[];
};

export type CategoryNode = CategoryRecord & {
  parentSlug: string | null;
  mobileImage: string | null;
  cardImage: string | null;
  children: CategoryNode[];
};
