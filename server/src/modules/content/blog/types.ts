import type { z } from "zod";
import type {
  createBlogCategorySchema,
  createBlogSchema,
  listAdminBlogsQuerySchema,
  listPublicBlogsQuerySchema,
  updateBlogCategorySchema,
  updateBlogSchema,
} from "./validators/blog.validators.ts";

export type CreateBlogCategoryInput = z.infer<typeof createBlogCategorySchema>;
export type UpdateBlogCategoryInput = z.infer<typeof updateBlogCategorySchema>;
export type CreateBlogInput = z.infer<typeof createBlogSchema>;
export type UpdateBlogInput = z.infer<typeof updateBlogSchema>;
export type ListPublicBlogsQuery = z.infer<typeof listPublicBlogsQuerySchema>;
export type ListAdminBlogsQuery = z.infer<typeof listAdminBlogsQuerySchema>;
