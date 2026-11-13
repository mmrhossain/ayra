import { z } from "zod";
import { AppError } from "../errors/AppError.ts";

export const encodeCursor = (value: unknown): string =>
  Buffer.from(JSON.stringify(value)).toString("base64url");

export const decodeCursor = <T>(cursor: string, schema: z.ZodType<T>): T => {
  let value: unknown;
  try {
    value = JSON.parse(Buffer.from(cursor, "base64url").toString("utf8"));
  } catch {
    throw new AppError("Invalid cursor", 400);
  }

  const parsed = schema.safeParse(value);
  if (!parsed.success) throw new AppError("Invalid cursor", 400);
  return parsed.data;
};
