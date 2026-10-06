import { z } from "zod";
import { env } from "../../../config/env.ts";

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const DEFAULT_RANGE_DAYS = 30;
const MAX_RANGE_DAYS = 366;

const isoDate = z.coerce.date();

const resolveDates = (val: {
  dateFrom?: Date | undefined;
  dateTo?: Date | undefined;
}): { dateFrom: Date; dateTo: Date } => {
  const dateTo = val.dateTo ?? new Date();
  const dateFrom =
    val.dateFrom ?? new Date(dateTo.getTime() - DEFAULT_RANGE_DAYS * MS_PER_DAY);
  return { dateFrom, dateTo };
};

const refineDateRange = (
  val: { dateFrom?: Date | undefined; dateTo?: Date | undefined },
  ctx: z.RefinementCtx
) => {
  const { dateFrom, dateTo } = resolveDates(val);

  if (dateFrom.getTime() > dateTo.getTime()) {
    ctx.addIssue({
      code: "custom",
      message: "dateFrom must be less than or equal to dateTo",
      path: ["dateFrom"],
    });
  }

  if (dateTo.getTime() - dateFrom.getTime() > MAX_RANGE_DAYS * MS_PER_DAY) {
    ctx.addIssue({
      code: "custom",
      message: "Date range cannot exceed 1 year",
      path: ["dateTo"],
    });
  }
};

const dateRangeObject = z.object({
  dateFrom: isoDate.optional(),
  dateTo: isoDate.optional(),
});

export const overviewQueryOpenApiSchema = z.object({
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  lowStockThreshold: z.coerce.number().int().min(0).max(1_000_000).optional(),
});

export const salesQueryOpenApiSchema = z.object({
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  groupBy: z.enum(["day", "week", "month"]).optional(),
});

export const topProductsQueryOpenApiSchema = z.object({
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  sortBy: z.enum(["revenue", "quantity"]).optional(),
});

export const ordersByStatusQueryOpenApiSchema = z.object({
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
});

export const overviewQuerySchema = dateRangeObject
  .extend({
    lowStockThreshold: z.coerce
      .number()
      .int()
      .min(0)
      .max(1_000_000)
      .default(env.LOW_STOCK_THRESHOLD),
  })
  .superRefine(refineDateRange)
  .transform((val) => ({
    ...val,
    ...resolveDates(val),
  }));

export const salesQuerySchema = dateRangeObject
  .extend({
    groupBy: z.enum(["day", "week", "month"]).default("day"),
  })
  .superRefine(refineDateRange)
  .transform((val) => ({
    ...val,
    ...resolveDates(val),
  }));

export const topProductsQuerySchema = dateRangeObject
  .extend({
    limit: z.coerce.number().int().min(1).max(100).default(10),
    sortBy: z.enum(["revenue", "quantity"]).default("revenue"),
  })
  .superRefine(refineDateRange)
  .transform((val) => ({
    ...val,
    ...resolveDates(val),
  }));

export const ordersByStatusQuerySchema = dateRangeObject
  .superRefine(refineDateRange)
  .transform((val) => ({
    ...val,
    ...resolveDates(val),
  }));
