import { Router } from "express";
import {
  listDivisionsHandler,
  listDistrictsHandler,
  listUnionsHandler,
  listUpazilasHandler,
} from "../controllers/geography.controller.ts";

const router = Router();

router.get("/geo/divisions", listDivisionsHandler);
router.get("/geo/districts", listDistrictsHandler);
router.get("/geo/upazilas", listUpazilasHandler);
router.get("/geo/unions", listUnionsHandler);

export default router;
