import { Router } from "express";
import { requireAuth } from "../../../common/middleware/auth.middleware.ts";
import {
  createAddressHandler,
  listAddressesHandler,
  getAddressHandler,
  updateAddressHandler,
  deleteAddressHandler,
} from "../controllers/address.controller.ts";

const router = Router();

router.post("/addresses", requireAuth, createAddressHandler);
router.get("/addresses", requireAuth, listAddressesHandler);
router.get("/addresses/:id", requireAuth, getAddressHandler);
router.put("/addresses/:id", requireAuth, updateAddressHandler);
router.delete("/addresses/:id", requireAuth, deleteAddressHandler);

export default router;
