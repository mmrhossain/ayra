import { AppError } from "../errors/AppError.ts";

export const requireParam = (value: unknown, name = "id"): string => {
  if (typeof value !== "string" || value.length === 0) {
    throw new AppError(`Invalid ${name} parameter`, 400);
  }

  return value;
};
