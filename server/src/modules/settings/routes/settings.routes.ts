import { Router } from "express";
import { getPublicSettingsHandler } from "../controllers/settings.controller.ts";

const router = Router();

router.get("/settings/public", getPublicSettingsHandler);

export default router;
