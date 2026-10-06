import { Router } from "express";
import {
  requireAuth,
  requireRole,
} from "../../../../common/middleware/auth.middleware.ts";
import {
  adminCreateBlogCategoryHandler,
  adminCreateBlogHandler,
  adminDeleteBlogCategoryHandler,
  adminDeleteBlogHandler,
  adminListBlogCategoriesHandler,
  adminListBlogsHandler,
  adminPublishBlogHandler,
  adminUpdateBlogCategoryHandler,
  adminUpdateBlogHandler,
  getPublicBlogHandler,
  getPublicBlogsHandler,
} from "../controllers/blog.controller.ts";

const router = Router();

router.get("/blogs", getPublicBlogsHandler);
router.get("/blogs/:slug", getPublicBlogHandler);

router.get(
  "/admin/blog-categories",
  requireAuth,
  requireRole("ADMIN"),
  adminListBlogCategoriesHandler
);
router.post(
  "/admin/blog-categories",
  requireAuth,
  requireRole("ADMIN"),
  adminCreateBlogCategoryHandler
);
router.put(
  "/admin/blog-categories/:id",
  requireAuth,
  requireRole("ADMIN"),
  adminUpdateBlogCategoryHandler
);
router.delete(
  "/admin/blog-categories/:id",
  requireAuth,
  requireRole("ADMIN"),
  adminDeleteBlogCategoryHandler
);

router.get("/admin/blogs", requireAuth, requireRole("ADMIN"), adminListBlogsHandler);
router.post("/admin/blogs", requireAuth, requireRole("ADMIN"), adminCreateBlogHandler);
router.put("/admin/blogs/:id", requireAuth, requireRole("ADMIN"), adminUpdateBlogHandler);
router.post(
  "/admin/blogs/:id/publish",
  requireAuth,
  requireRole("ADMIN"),
  adminPublishBlogHandler
);
router.delete("/admin/blogs/:id", requireAuth, requireRole("ADMIN"), adminDeleteBlogHandler);

export default router;
