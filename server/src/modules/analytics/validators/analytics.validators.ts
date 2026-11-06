import { z } from "zod";
import { env } from "../../../config/env.ts";
import {
  addDhakaDays,
  addDhakaMonths,
  addDhakaYears,
  endOfDhakaDay,
  startOfDhakaDay,
  startOfDhakaMonth,
  startOfDhakaYear,
} from "../utils/dhaka-time.ts";

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const DEFAULT_RANGE_DAYS = 30;
const MAX_RANGE_DAYS = 366;
const MAX_YEAR_RANGE_DAYS = MAX_RANGE_DAYS * 6;

const isoDate = z.coerce.date();

const rangeSchema = z.enum(["day", "month", "year"]).default("day");
const groupBySchema = z.enum(["day", "week", "month", "year"]).optional();

type RangeInput = {
  dateFrom?: Date | undefined;
  dateTo?: Date | undefined;
  range?: "day" | "month" | "year" | undefined;
  groupBy?: "day" | "week" | "month" | "year" | undefined;
};

const capDays = (val: RangeInput): number =>
  val.range === "year" || val.groupBy === "year"
    ? MAX_YEAR_RANGE_DAYS
    : MAX_RANGE_DAYS;

const resolveDates = (val: RangeInput): { dateFrom: Date; dateTo: Date } => {
  const dateTo = endOfDhakaDay(val.dateTo ?? new Date());

  if (val.dateFrom) {
    return { dateFrom: startOfDhakaDay(val.dateFrom), dateTo };
  }

  if (val.range === "year") {
    return { dateFrom: startOfDhakaYear(addDhakaYears(dateTo, -4)), dateTo };
  }
  if (val.range === "month") {
    return { dateFrom: startOfDhakaMonth(addDhakaMonths(dateTo, -11)), dateTo };
  }
  return {
    dateFrom: startOfDhakaDay(addDhakaDays(dateTo, -(DEFAULT_RANGE_DAYS - 1))),
    dateTo,
  };
};

const refineDateRange = (val: RangeInput, ctx: z.RefinementCtx) => {
  const { dateFrom, dateTo } = resolveDates(val);

  if (dateFrom.getTime() > dateTo.getTime()) {
    ctx.addIssue({
      code: "custom",
      message: "dateFrom must be less than or equal to dateTo",
      path: ["dateFrom"],
    });
  }

  if (dateTo.getTime() - dateFrom.getTime() > capDays(val) * MS_PER_DAY) {
    ctx.addIssue({
      code: "custom",
      message: "Date range cannot exceed the maximum for this granularity",
      path: ["dateTo"],
    });
  }
};

const dateRangeObject = z.object({
  dateFrom: isoDate.optional(),
  dateTo: isoDate.optional(),
});

const currencySchema = z.enum(["BDT", "USD"]).default("BDT");

export const overviewQueryOpenApiSchema = z.object({
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  range: z.enum(["day", "month", "year"]).optional(),
  lowStockThreshold: z.coerce.number().int().min(0).max(1_000_000).optional(),
  currency: z.enum(["BDT", "USD"]).optional(),
});

export const salesQueryOpenApiSchema = z.object({
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  groupBy: z.enum(["day", "week", "month", "year"]).optional(),
  range: z.enum(["day", "month", "year"]).optional(),
  currency: z.enum(["BDT", "USD"]).optional(),
});

export const topProductsQueryOpenApiSchema = z.object({
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  range: z.enum(["day", "month", "year"]).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  sortBy: z.enum(["revenue", "quantity"]).optional(),
  currency: z.enum(["BDT", "USD"]).optional(),
});

export const ordersByStatusQueryOpenApiSchema = z.object({
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  range: z.enum(["day", "month", "year"]).optional(),
  currency: z.enum(["BDT", "USD"]).optional(),
});

export const overviewQuerySchema = dateRangeObject
  .extend({
    range: rangeSchema,
    lowStockThreshold: z.coerce
      .number()
      .int()
      .min(0)
      .max(1_000_000)
      .default(env.LOW_STOCK_THRESHOLD),
    currency: currencySchema,
  })
  .superRefine(refineDateRange)
  .transform((val) => ({
    ...val,
    ...resolveDates(val),
  }));

export const salesQuerySchema = dateRangeObject
  .extend({
    groupBy: groupBySchema,
    range: rangeSchema,
    currency: currencySchema,
  })
  .superRefine(refineDateRange)
  .transform((val) => ({
    ...val,
    groupBy: val.groupBy ?? val.range,
    ...resolveDates(val),
  }));

export const topProductsQuerySchema = dateRangeObject
  .extend({
    range: rangeSchema,
    limit: z.coerce.number().int().min(1).max(100).default(10),
    sortBy: z.enum(["revenue", "quantity"]).default("revenue"),
    currency: currencySchema,
  })
  .superRefine(refineDateRange)
  .transform((val) => ({
    ...val,
    ...resolveDates(val),
  }));

export const ordersByStatusQuerySchema = dateRangeObject
  .extend({ range: rangeSchema, currency: currencySchema })
  .superRefine(refineDateRange)
  .transform((val) => ({
    ...val,
    ...resolveDates(val),
  }));
