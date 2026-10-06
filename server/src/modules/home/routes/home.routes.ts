import { Router } from "express";
import { getHomeHandler } from "../controllers/home.controller.ts";

const router = Router();

router.get("/home", getHomeHandler);

export default router;
