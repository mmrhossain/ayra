import { Prisma } from "../../generated/prisma/client.ts";

export const isPrismaKnownRequestError = (
  err: unknown
): err is Prisma.PrismaClientKnownRequestError =>
  err instanceof Prisma.PrismaClientKnownRequestError;

export const isPrismaCode = (err: unknown, code: string): boolean =>
  isPrismaKnownRequestError(err) && err.code === code;
