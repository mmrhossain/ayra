import type { z } from "zod";
import type { Prisma } from "../../generated/prisma/client.ts";
import type {
  ordersByStatusQuerySchema,
  overviewQuerySchema,
  salesQuerySchema,
  topProductsQuerySchema,
} from "./validators/analytics.validators.ts";

export type DateRange = {
  dateFrom?: Date;
  dateTo?: Date;
};

export type DateWindow = {
  dateFrom: Date;
  dateTo: Date;
};

export type OverviewQuery = z.output<typeof overviewQuerySchema>;
export type SalesQuery = z.output<typeof salesQuerySchema>;
export type TopProductsQuery = z.output<typeof topProductsQuerySchema>;
export type OrdersByStatusQuery = z.output<typeof ordersByStatusQuerySchema>;

export type SalesBucketRow = {
  bucket: Date;
  revenue: Prisma.Decimal | number | null;
  orders: bigint | number;
};
