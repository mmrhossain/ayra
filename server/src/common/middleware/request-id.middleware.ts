import { randomUUID } from "node:crypto";
import type { NextFunction, Request, Response } from "express";

const MAX_INCOMING_ID_LENGTH = 128;

export const requestIdMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const incoming = req.header("x-request-id")?.trim();
  const requestId =
    incoming && incoming.length > 0 && incoming.length <= MAX_INCOMING_ID_LENGTH
      ? incoming
      : randomUUID();

  req.requestId = requestId;
  res.setHeader("X-Request-Id", requestId);
  next();
};
