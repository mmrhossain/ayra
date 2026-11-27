import { Router } from "express";
import { optionalAuth } from "../../../common/middleware/auth.middleware.ts";
import { aiChatLimiter } from "../../../common/middleware/rate-limit.middleware.ts";
import { chatHandler } from "../controllers/ai.controller.ts";

const router = Router();

router.post("/ai/chat", optionalAuth, aiChatLimiter, chatHandler);

export default router;
