import { Router } from "express";
import {
  requireAuth,
  requireRole,
} from "../../../../common/middleware/auth.middleware.ts";
import {
  createAttributeHandler,
  createAttributeValuesHandler,
  createAttributeValueHandler,
  deleteAttributeHandler,
  deleteAttributeValueHandler,
  getAttributeHandler,
  getAttributes,
  updateAttributeHandler,
  updateAttributeValueHandler,
} from "../controllers/attribute.controller.ts";

const router = Router();

router.get("/attributes", getAttributes);
router.get("/attributes/:id", getAttributeHandler);

const adminOnly = [requireAuth, requireRole("ADMIN")];

router.post("/admin/attributes", ...adminOnly, createAttributeHandler);
router.put("/admin/attributes/:id", ...adminOnly, updateAttributeHandler);
router.delete("/admin/attributes/:id", ...adminOnly, deleteAttributeHandler);
router.post(
  "/admin/attributes/:attributeId/values",
  ...adminOnly,
  createAttributeValueHandler
);
router.post(
  "/admin/attributes/:attributeId/values/bulk",
  ...adminOnly,
  createAttributeValuesHandler
);
router.put(
  "/admin/attribute-values/:id",
  ...adminOnly,
  updateAttributeValueHandler
);
router.delete(
  "/admin/attribute-values/:id",
  ...adminOnly,
  deleteAttributeValueHandler
);

export default router;
