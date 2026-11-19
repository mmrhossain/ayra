import { prisma, type TransactionClient } from "../../lib/prisma.ts";
import { cacheGet, cacheSet, cacheDel } from "../../lib/cache.ts";
import { AppError } from "../../common/errors/AppError.ts";
import { isPrismaCode } from "../../common/utils/prisma-error.ts";

const CACHE_KEY = "cache:tax-classes:v1";
export type TaxClassLookup = { id: string; name: string; code: string; rate: number; isActive: boolean };
export type TaxClassInput = Omit<TaxClassLookup, "id">;

// Cache reference data only. Prices, discounts and totals are always calculated.
export const getTaxClasses = async (): Promise<TaxClassLookup[]> => {
  const cached = await cacheGet<TaxClassLookup[]>(CACHE_KEY);
  if (cached) return cached;
  const rows = await prisma.taxClass.findMany({ orderBy: { code: "asc" } });
  const result = rows.map(row => ({ ...row, rate: Number(row.rate) }));
  await cacheSet(CACHE_KEY, result, 120);
  return result;
};

export const assertAssignableTaxClass = async (id: string | null | undefined, db: TransactionClient) => {
  if (!id) return;
  const row = await db.taxClass.findUnique({ where: { id }, select: { isActive: true } });
  if (!row?.isActive) throw new AppError("Active tax class not found", 400);
};

export const saveTaxClass = async (input: { [K in keyof TaxClassInput]?: TaxClassInput[K] | undefined }, id?: string) => {
  const data = Object.fromEntries(Object.entries(input).filter(([, value]) => value !== undefined)) as Partial<TaxClassInput>;
  try {
    const result = id
      ? await prisma.taxClass.update({ where: { id }, data })
      : await prisma.taxClass.create({ data: data as TaxClassInput });
    await cacheDel(CACHE_KEY);
    return { ...result, rate: Number(result.rate) };
  } catch (error) {
    if (isPrismaCode(error, "P2002")) throw new AppError("Tax class code already exists", 409);
    if (isPrismaCode(error, "P2025")) throw new AppError("Tax class not found", 404);
    throw error;
  }
};

export const deleteTaxClass = async (id: string): Promise<void> => {
  try {
    await prisma.taxClass.delete({ where: { id } });
  } catch (error) {
    if (isPrismaCode(error, "P2003")) {
      throw new AppError("This tax class is assigned to products. Reassign those products before deleting it.", 409);
    }
    if (isPrismaCode(error, "P2025")) throw new AppError("Tax class not found", 404);
    throw error;
  }
  await cacheDel(CACHE_KEY);
};
