import type { Request, Response } from "express";
import { asyncHandler } from "../../../common/utils/asyncHandler.ts";
import { successResponse } from "../../../common/utils/response.ts";
import { chatSchema } from "../validators/ai.validators.ts";
import { chat } from "../services/ai.service.ts";

export const chatHandler = asyncHandler(async (req: Request, res: Response) => {
  const input = chatSchema.parse(req.body);

  const result = await chat(input);

  successResponse(
    res,
    result,
    result.cached ? "Cached AI response" : "AI response"
  );
});
