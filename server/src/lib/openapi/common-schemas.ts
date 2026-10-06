import { z } from "zod";
import { registry } from "./registry.ts";

export const ErrorResponseSchema = registry.register(
  "ErrorResponse",
  z.object({
    success: z.literal(false),
    message: z.string(),
  })
);

export const PaginationMetaSchema = registry.register(
  "PaginationMeta",
  z.object({
    page: z.number().int(),
    limit: z.number().int(),
    total: z.number().int(),
    totalPages: z.number().int(),
  })
);

export const IdParamSchema = z.object({
  id: z.string().min(1),
});

export const successEnvelope = <T extends z.ZodTypeAny>(data: T) =>
  z.object({
    success: z.literal(true),
    message: z.string(),
    data,
  });

const ERROR_DESCRIPTIONS: Record<number, string> = {
  400: "Validation failed",
  401: "Unauthorized",
  403: "Forbidden",
  404: "Not found",
  409: "Conflict",
  429: "Too many requests",
  500: "Internal server error",
  502: "Bad gateway",
  504: "Gateway timeout",
};

export const jsonContent = (schema: z.ZodTypeAny) => ({
  content: {
    "application/json": { schema },
  },
});

export const jsonBody = (schema: z.ZodTypeAny) => ({
  content: {
    "application/json": { schema },
  },
});

export const successResponse = (
  description: string,
  data: z.ZodTypeAny = z.unknown()
) => ({
  description,
  ...jsonContent(successEnvelope(data)),
});

export const errorResponses = (...codes: number[]) => {
  const responses: Record<
    string,
    { description: string; content: { "application/json": { schema: typeof ErrorResponseSchema } } }
  > = {};

  for (const code of codes) {
    responses[String(code)] = {
      description: ERROR_DESCRIPTIONS[code] ?? `HTTP ${code}`,
      content: {
        "application/json": { schema: ErrorResponseSchema },
      },
    };
  }

  return responses;
};
