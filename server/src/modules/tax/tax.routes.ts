import { Router } from "express";
import { z } from "zod";
import { requireAuth, requireRole } from "../../common/middleware/auth.middleware.ts";
import { asyncHandler } from "../../common/utils/asyncHandler.ts";
import { requireParam } from "../../common/utils/requireParam.ts";
import { successResponse } from "../../common/utils/response.ts";
import { getTaxClasses, saveTaxClass } from "./tax.service.ts";

const router = Router();
const schema = z.object({
  name: z.string().trim().min(1).max(120),
  code: z.string().trim().min(1).max(50).regex(/^[A-Za-z0-9_-]+$/).transform(v => v.toUpperCase()),
  rate: z.number().min(0).max(100).multipleOf(0.01),
  isActive: z.boolean(),
});
const admin = [requireAuth, requireRole("ADMIN")];
router.get("/admin/tax-classes", ...admin, asyncHandler(async (_req, res) => {
  successResponse(res, await getTaxClasses(), "Tax classes fetched");
}));
router.post("/admin/tax-classes", ...admin, asyncHandler(async (req, res) => {
  successResponse(res, await saveTaxClass(schema.extend({ isActive: z.boolean().default(true) }).parse(req.body)), "Tax class created", 201);
}));
router.put("/admin/tax-classes/:id", ...admin, asyncHandler(async (req, res) => {
  successResponse(res, await saveTaxClass(schema.partial().parse(req.body), requireParam(req.params.id, "id")), "Tax class updated");
}));
// Deactivate classes instead of deleting reference data assigned to products.
router.delete("/admin/tax-classes/:id", ...admin, asyncHandler(async (req, res) => {
  successResponse(res, await saveTaxClass({ isActive: false }, requireParam(req.params.id, "id")), "Tax class deactivated");
}));
export default router;
