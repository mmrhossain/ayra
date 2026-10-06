import { Router } from "express";
import {
  requireAuth,
  requireRole,
} from "../../../../common/middleware/auth.middleware.ts";
import {
  adminCreateFaqCategoryHandler,
  adminCreateFaqItemHandler,
  adminDeleteFaqCategoryHandler,
  adminDeleteFaqItemHandler,
  adminListFaqCategoriesHandler,
  adminListFaqItemsHandler,
  adminUpdateFaqCategoryHandler,
  adminUpdateFaqItemHandler,
  getFaqsHandler,
} from "../controllers/faq.controller.ts";

const router = Router();

router.get("/faqs", getFaqsHandler);

router.get(
  "/admin/faq-categories",
  requireAuth,
  requireRole("ADMIN"),
  adminListFaqCategoriesHandler
);
router.post(
  "/admin/faq-categories",
  requireAuth,
  requireRole("ADMIN"),
  adminCreateFaqCategoryHandler
);
router.put(
  "/admin/faq-categories/:id",
  requireAuth,
  requireRole("ADMIN"),
  adminUpdateFaqCategoryHandler
);
router.delete(
  "/admin/faq-categories/:id",
  requireAuth,
  requireRole("ADMIN"),
  adminDeleteFaqCategoryHandler
);

router.get(
  "/admin/faq-items",
  requireAuth,
  requireRole("ADMIN"),
  adminListFaqItemsHandler
);
router.post(
  "/admin/faq-items",
  requireAuth,
  requireRole("ADMIN"),
  adminCreateFaqItemHandler
);
router.put(
  "/admin/faq-items/:id",
  requireAuth,
  requireRole("ADMIN"),
  adminUpdateFaqItemHandler
);
router.delete(
  "/admin/faq-items/:id",
  requireAuth,
  requireRole("ADMIN"),
  adminDeleteFaqItemHandler
);

export default router;
