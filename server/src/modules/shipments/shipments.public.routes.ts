import { Router } from "express";
import { trackShipmentHandler } from "./shipments.controller.ts";

const router = Router();

router.get("/shipments/track/:shipmentNumber", trackShipmentHandler);

export default router;
