import { prisma, type TransactionClient } from "../../../lib/prisma.ts";
import { AppError } from "../../../common/errors/AppError.ts";
import { isPrismaCode } from "../../../common/utils/prisma-error.ts";
import type {
  AddressLike,
  CreateShippingMethodInput,
  CreateShippingRateInput,
  CreateShippingZoneInput,
  ShippingQuote,
  UpdateShippingMethodInput,
  UpdateShippingRateInput,
  UpdateShippingZoneInput,
} from "../types.ts";

type DbClient = Pick<
  TransactionClient,
  "shippingZone" | "shippingMethod" | "shippingRate"
>;

const money = (value: { toNumber: () => number } | number | string | null | undefined) => {
  if (value == null) return null;
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value);
  return value.toNumber();
};

const roundMoney = (value: number) => Math.round(value * 100) / 100;

const normalizeDistrict = (value: string | null | undefined) =>
  (value ?? "").trim().toLowerCase();

const zoneSelect = {
  id: true,
  name: true,
  code: true,
  isActive: true,
  isFallback: true,
  matchDistricts: true,
  createdAt: true,
  updatedAt: true,
} as const;

const methodSelect = {
  id: true,
  name: true,
  code: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} as const;

const rateInclude = {
  shippingZone: { select: zoneSelect },
  shippingMethod: { select: methodSelect },
} as const;

const serializeRate = (rate: {
  id: string;
  price: { toNumber: () => number } | number | string;
  freeShippingFrom: { toNumber: () => number } | number | string | null;
  isActive: boolean;
  shippingZoneId: string;
  shippingMethodId: string;
  createdAt: Date;
  updatedAt: Date;
  shippingZone?: unknown;
  shippingMethod?: unknown;
}) => ({
  id: rate.id,
  price: money(rate.price) ?? 0,
  freeShippingFrom: money(rate.freeShippingFrom),
  isActive: rate.isActive,
  shippingZoneId: rate.shippingZoneId,
  shippingMethodId: rate.shippingMethodId,
  createdAt: rate.createdAt,
  updatedAt: rate.updatedAt,
  shippingZone: rate.shippingZone,
  shippingMethod: rate.shippingMethod,
});

const districtMatches = (zoneDistricts: string[], district: string) => {
  const needle = normalizeDistrict(district);
  if (!needle) return false;
  return zoneDistricts.some((item) => normalizeDistrict(item) === needle);
};

export const resolveShippingZone = async (
  address: AddressLike,
  db: DbClient = prisma
) => {
  const district = address.district?.trim() ?? "";
  if (!district) {
    throw new AppError("Delivery district is required to calculate shipping", 400);
  }

  const zones = await db.shippingZone.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "asc" },
  });

  if (zones.length === 0) {
    throw new AppError("No shipping zones are configured", 400);
  }

  const matched = zones.find(
    (zone) => !zone.isFallback && districtMatches(zone.matchDistricts, district)
  );
  if (matched) return matched;

  const fallback = zones.find((zone) => zone.isFallback);
  if (fallback) return fallback;

  throw new AppError("No shipping zone is available for this address", 400);
};

export const calculateQuoteFromRate = (
  rate: {
    id: string;
    price: { toNumber: () => number } | number | string;
    freeShippingFrom: { toNumber: () => number } | number | string | null;
    shippingZone: { id: string; name: string; code: string };
    shippingMethod: { id: string; name: string; code: string };
  },
  subtotal: number
): ShippingQuote => {
  const price = roundMoney(money(rate.price) ?? 0);
  const freeShippingFrom = money(rate.freeShippingFrom);
  const isFreeShipping =
    freeShippingFrom != null && subtotal >= freeShippingFrom;
  const shippingAmount = isFreeShipping ? 0 : price;

  return {
    zoneId: rate.shippingZone.id,
    zoneName: rate.shippingZone.name,
    zoneCode: rate.shippingZone.code,
    methodId: rate.shippingMethod.id,
    methodName: rate.shippingMethod.name,
    methodCode: rate.shippingMethod.code,
    rateId: rate.id,
    price,
    freeShippingFrom,
    shippingAmount,
    isFreeShipping,
  };
};

export const listShippingOptions = async (
  address: AddressLike,
  subtotal = 0,
  db: DbClient = prisma
) => {
  const district = address.district?.trim() ?? "";
  if (!district) {
    throw new AppError("Delivery district is required to calculate shipping", 400);
  }

  const zones = await db.shippingZone.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "asc" },
    include: {
      rates: {
        where: { isActive: true, shippingMethod: { isActive: true } },
        include: { shippingMethod: { select: methodSelect } },
        orderBy: [{ price: "asc" }, { createdAt: "asc" }],
      },
    },
  });

  if (zones.length === 0) {
    throw new AppError("No shipping zones are configured", 400);
  }

  const matched = zones.find(
    (zone) => !zone.isFallback && districtMatches(zone.matchDistricts, district)
  );
  const zone = matched ?? zones.find((item) => item.isFallback);
  if (!zone) {
    throw new AppError("No shipping zone is available for this address", 400);
  }

  return {
    zone: {
      id: zone.id,
      name: zone.name,
      code: zone.code,
    },
    options: zone.rates.map((rate) =>
      calculateQuoteFromRate(
        { ...rate, shippingZone: zone, shippingMethod: rate.shippingMethod },
        subtotal,
      ),
    ),
  };
};

export const quoteShipping = async (
  address: AddressLike,
  methodCode: string,
  subtotal = 0,
  db: DbClient = prisma
): Promise<ShippingQuote> => {
  const district = address.district?.trim() ?? "";
  if (!district) {
    throw new AppError("Delivery district is required to calculate shipping", 400);
  }

  const code = methodCode.trim().toUpperCase();
  const zones = await db.shippingZone.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "asc" },
    include: {
      rates: {
        where: { shippingMethod: { code } },
        include: { shippingMethod: { select: methodSelect } },
      },
    },
  });

  if (zones.length === 0) {
    throw new AppError("No shipping zones are configured", 400);
  }

  const matched = zones.find(
    (zone) => !zone.isFallback && districtMatches(zone.matchDistricts, district)
  );
  const zone = matched ?? zones.find((item) => item.isFallback);
  if (!zone) {
    throw new AppError("No shipping zone is available for this address", 400);
  }

  const rate = zone.rates[0];
  const methodFromRates = zones
    .flatMap((item) => item.rates)
    .map((item) => item.shippingMethod)[0];

  if (!rate) {
    if (methodFromRates) {
      if (!methodFromRates.isActive) {
        throw new AppError("Invalid shipping method", 400);
      }
      throw new AppError("No shipping rate is available for this method and address", 400);
    }
    const method = await db.shippingMethod.findUnique({
      where: { code },
    });
    if (!method || !method.isActive) {
      throw new AppError("Invalid shipping method", 400);
    }
    throw new AppError("No shipping rate is available for this method and address", 400);
  }

  if (!rate.shippingMethod.isActive) {
    throw new AppError("Invalid shipping method", 400);
  }

  if (!rate.isActive) {
    throw new AppError("No shipping rate is available for this method and address", 400);
  }

  return calculateQuoteFromRate(
    { ...rate, shippingZone: zone, shippingMethod: rate.shippingMethod },
    subtotal,
  );
};

export const listShippingZones = async () => {
  return prisma.shippingZone.findMany({
    orderBy: { createdAt: "asc" },
    select: zoneSelect,
  });
};

export const getShippingZoneById = async (id: string) => {
  const zone = await prisma.shippingZone.findUnique({
    where: { id },
    select: zoneSelect,
  });
  if (!zone) throw new AppError("Shipping zone not found", 404);
  return zone;
};

export const createShippingZone = async (input: CreateShippingZoneInput) => {
  const code = input.code.trim().toUpperCase();
  const existing = await prisma.shippingZone.findUnique({
    where: { code },
  });
  if (existing) throw new AppError("Shipping zone code already exists", 409);

  if (input.isFallback) {
    await prisma.shippingZone.updateMany({
      data: { isFallback: false },
      where: { isFallback: true },
    });
  }

  return prisma.shippingZone.create({
    data: {
      name: input.name,
      code,
      isActive: input.isActive,
      isFallback: input.isFallback,
      matchDistricts: input.matchDistricts,
    },
    select: zoneSelect,
  });
};

export const updateShippingZone = async (
  id: string,
  input: UpdateShippingZoneInput
) => {
  const existing = await prisma.shippingZone.findUnique({ where: { id } });
  if (!existing) throw new AppError("Shipping zone not found", 404);

  const nextZoneCode = input.code?.trim().toUpperCase();
  if (nextZoneCode && nextZoneCode !== existing.code) {
    const taken = await prisma.shippingZone.findUnique({
      where: { code: nextZoneCode },
    });
    if (taken) throw new AppError("Shipping zone code already exists", 409);
  }

  if (input.isFallback) {
    await prisma.shippingZone.updateMany({
      data: { isFallback: false },
      where: { isFallback: true, id: { not: id } },
    });
  }

  return prisma.shippingZone.update({
    where: { id },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(nextZoneCode !== undefined && { code: nextZoneCode }),
      ...(input.isActive !== undefined && { isActive: input.isActive }),
      ...(input.isFallback !== undefined && { isFallback: input.isFallback }),
      ...(input.matchDistricts !== undefined && {
        matchDistricts: input.matchDistricts,
      }),
    },
    select: zoneSelect,
  });
};

export const deleteShippingZone = async (id: string) => {
  const existing = await prisma.shippingZone.findUnique({ where: { id } });
  if (!existing) throw new AppError("Shipping zone not found", 404);

  await prisma.shippingZone.delete({ where: { id } });
  return { id };
};

export const listShippingMethods = async () => {
  return prisma.shippingMethod.findMany({
    orderBy: { createdAt: "asc" },
    select: methodSelect,
  });
};

export const getShippingMethodById = async (id: string) => {
  const method = await prisma.shippingMethod.findUnique({
    where: { id },
    select: methodSelect,
  });
  if (!method) throw new AppError("Shipping method not found", 404);
  return method;
};

export const createShippingMethod = async (input: CreateShippingMethodInput) => {
  const code = input.code.trim().toUpperCase();
  const existing = await prisma.shippingMethod.findUnique({
    where: { code },
  });
  if (existing) throw new AppError("Shipping method code already exists", 409);

  return prisma.shippingMethod.create({
    data: {
      name: input.name,
      code,
      isActive: input.isActive,
    },
    select: methodSelect,
  });
};

export const updateShippingMethod = async (
  id: string,
  input: UpdateShippingMethodInput
) => {
  const existing = await prisma.shippingMethod.findUnique({ where: { id } });
  if (!existing) throw new AppError("Shipping method not found", 404);

  const nextMethodCode = input.code?.trim().toUpperCase();
  if (nextMethodCode && nextMethodCode !== existing.code) {
    const taken = await prisma.shippingMethod.findUnique({
      where: { code: nextMethodCode },
    });
    if (taken) throw new AppError("Shipping method code already exists", 409);
  }

  return prisma.shippingMethod.update({
    where: { id },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(nextMethodCode !== undefined && { code: nextMethodCode }),
      ...(input.isActive !== undefined && { isActive: input.isActive }),
    },
    select: methodSelect,
  });
};

export const listShippingRates = async () => {
  const rates = await prisma.shippingRate.findMany({
    include: rateInclude,
    orderBy: { createdAt: "asc" },
  });
  return rates.map(serializeRate);
};

export const getShippingRateById = async (id: string) => {
  const rate = await prisma.shippingRate.findUnique({
    where: { id },
    include: rateInclude,
  });
  if (!rate) throw new AppError("Shipping rate not found", 404);
  return serializeRate(rate);
};

const assertZoneAndMethod = async (
  shippingZoneId: string,
  shippingMethodId: string
) => {
  const [zone, method] = await Promise.all([
    prisma.shippingZone.findUnique({ where: { id: shippingZoneId } }),
    prisma.shippingMethod.findUnique({ where: { id: shippingMethodId } }),
  ]);
  if (!zone) throw new AppError("Shipping zone not found", 404);
  if (!method) throw new AppError("Shipping method not found", 404);
};

export const createShippingRate = async (input: CreateShippingRateInput) => {
  await assertZoneAndMethod(input.shippingZoneId, input.shippingMethodId);

  try {
    const rate = await prisma.shippingRate.create({
      data: {
        shippingZoneId: input.shippingZoneId,
        shippingMethodId: input.shippingMethodId,
        price: input.price,
        freeShippingFrom: input.freeShippingFrom ?? null,
        isActive: input.isActive,
      },
      include: rateInclude,
    });
    return serializeRate(rate);
  } catch (err) {
    if (isPrismaCode(err, "P2002")) {
      throw new AppError("A rate already exists for this zone and method", 409);
    }
    throw err;
  }
};

export const updateShippingRate = async (
  id: string,
  input: UpdateShippingRateInput
) => {
  const existing = await prisma.shippingRate.findUnique({ where: { id } });
  if (!existing) throw new AppError("Shipping rate not found", 404);

  const nextZoneId = input.shippingZoneId ?? existing.shippingZoneId;
  const nextMethodId = input.shippingMethodId ?? existing.shippingMethodId;
  await assertZoneAndMethod(nextZoneId, nextMethodId);

  try {
    const rate = await prisma.shippingRate.update({
      where: { id },
      data: {
        ...(input.shippingZoneId !== undefined && {
          shippingZoneId: input.shippingZoneId,
        }),
        ...(input.shippingMethodId !== undefined && {
          shippingMethodId: input.shippingMethodId,
        }),
        ...(input.price !== undefined && { price: input.price }),
        ...(input.freeShippingFrom !== undefined && {
          freeShippingFrom: input.freeShippingFrom,
        }),
        ...(input.isActive !== undefined && { isActive: input.isActive }),
      },
      include: rateInclude,
    });
    return serializeRate(rate);
  } catch (err) {
    if (isPrismaCode(err, "P2002")) {
      throw new AppError("A rate already exists for this zone and method", 409);
    }
    throw err;
  }
};

export const deleteShippingRate = async (id: string) => {
  const existing = await prisma.shippingRate.findUnique({ where: { id } });
  if (!existing) throw new AppError("Shipping rate not found", 404);

  await prisma.shippingRate.delete({ where: { id } });
  return { id };
};
