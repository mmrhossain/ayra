import { Router } from "express";
import { requireAuth, requireCustomer } from "../../../common/middleware/auth.middleware.ts";
import {
  createAddressHandler,
  listAddressesHandler,
  getAddressHandler,
  updateAddressHandler,
  deleteAddressHandler,
} from "../controllers/address.controller.ts";

const router = Router();

const customerOnly = [requireAuth, requireCustomer];

router.post("/addresses", ...customerOnly, createAddressHandler);
router.get("/addresses", ...customerOnly, listAddressesHandler);
router.get("/addresses/:id", ...customerOnly, getAddressHandler);
router.put("/addresses/:id", ...customerOnly, updateAddressHandler);
router.delete("/addresses/:id", ...customerOnly, deleteAddressHandler);

export default router;
