import { Router } from "express";
import {
  getHomeHandler,
  getHomeSectionProductsHandler,
} from "../controllers/home.controller.ts";

const router = Router();

router.get("/home/sections/:id/products", getHomeSectionProductsHandler);
router.get("/home", getHomeHandler);

export default router;
