import { Router } from "express";
import { requireAuth, requireRole } from "../../../common/middleware/auth.middleware.ts";
import { asyncHandler } from "../../../common/utils/asyncHandler.ts";
import { requireParam } from "../../../common/utils/requireParam.ts";
import { successResponse } from "../../../common/utils/response.ts";
import { collectionCursorSchema, createCollectionSchema, listCollectionsSchema, updateCollectionSchema } from "./collection.validators.ts";
import { getAdminCollection, getCollectionPage, listCollections, saveCollection } from "./collection.service.ts";
const router = Router();
const admin = [requireAuth, requireRole("ADMIN")];
router.get("/collections/:slug/products", asyncHandler(async (req, res) => {
  const query = collectionCursorSchema.parse(req.query);
  successResponse(res, await getCollectionPage(requireParam(req.params.slug, "slug"), query.cursor), "Collection products fetched");
}));
router.get("/admin/collections", ...admin, asyncHandler(async (req, res) => {
  successResponse(res, await listCollections(listCollectionsSchema.parse(req.query)), "Collections fetched");
}));
router.get("/admin/collections/:id", ...admin, asyncHandler(async (req, res) => {
  successResponse(res, await getAdminCollection(requireParam(req.params.id, "id")), "Collection fetched");
}));
router.post("/admin/collections", ...admin, asyncHandler(async (req, res) => {
  successResponse(res, await saveCollection(createCollectionSchema.parse(req.body)), "Collection created", 201);
}));
router.put("/admin/collections/:id", ...admin, asyncHandler(async (req, res) => {
  successResponse(res, await saveCollection(updateCollectionSchema.parse(req.body), requireParam(req.params.id, "id")), "Collection updated");
}));
router.delete("/admin/collections/:id", ...admin, asyncHandler(async (req, res) => {
  successResponse(res, await saveCollection({
    isActive: false
  }, requireParam(req.params.id, "id")), "Collection deactivated");
}));
export default router;
