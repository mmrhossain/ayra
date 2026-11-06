import { z } from "zod";

const geoCodeSchema = z
  .string()
  .trim()
  .regex(/^[A-Za-z0-9-]{1,32}$/, "Invalid geography code");

export const listDistrictsQuerySchema = z.object({
  divisionCode: geoCodeSchema,
});

export const listUpazilasQuerySchema = z.object({
  districtCode: geoCodeSchema,
});

export const listUnionsQuerySchema = z.object({
  upazilaCode: geoCodeSchema,
  districtCode: geoCodeSchema.optional(),
});
