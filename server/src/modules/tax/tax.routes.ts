import { Router } from "express";
import { createTaxClassSchema, updateTaxClassSchema } from "./tax.validator.ts";
import { requireAuth, requireRole } from "../../common/middleware/auth.middleware.ts";
import { asyncHandler } from "../../common/utils/asyncHandler.ts";
import { requireParam } from "../../common/utils/requireParam.ts";
import { successResponse } from "../../common/utils/response.ts";
import { deleteTaxClass, getTaxClasses, saveTaxClass } from "./tax.service.ts";

const router = Router();
const admin = [requireAuth, requireRole("ADMIN")];
router.get("/admin/tax-classes", ...admin, asyncHandler(async (_req, res) => {
  successResponse(res, await getTaxClasses(), "Tax classes fetched");
}));
router.post("/admin/tax-classes", ...admin, asyncHandler(async (req, res) => {
  successResponse(res, await saveTaxClass(createTaxClassSchema.parse(req.body)), "Tax class created", 201);
}));
router.put("/admin/tax-classes/:id", ...admin, asyncHandler(async (req, res) => {
  successResponse(res, await saveTaxClass(updateTaxClassSchema.parse(req.body), requireParam(req.params.id, "id")), "Tax class updated");
}));
router.delete("/admin/tax-classes/:id", ...admin, asyncHandler(async (req, res) => {
  await deleteTaxClass(requireParam(req.params.id, "id"));
  successResponse(res, null, "Tax class deleted");
}));
export default router;
