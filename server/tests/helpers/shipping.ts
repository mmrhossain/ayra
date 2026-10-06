import { prisma } from "../../src/lib/prisma.ts";

export const DEFAULT_SHIPPING_RATES = {
  INSIDE_STANDARD: 60,
  INSIDE_EXPRESS: 120,
  OUTSIDE_STANDARD: 120,
  OUTSIDE_EXPRESS: 200,
} as const;

export const ensureDefaultShippingCatalog = async () => {
  const existingInside = await prisma.shippingZone.findUnique({
    where: { code: "INSIDE_DHAKA" },
  });
  const insideDhaka =
    existingInside ??
    (await prisma.shippingZone.create({
      data: {
        name: "Inside Dhaka",
        code: "INSIDE_DHAKA",
        isActive: true,
        isFallback: false,
        matchDistricts: ["Dhaka"],
      },
    }));

  const existingOutside = await prisma.shippingZone.findUnique({
    where: { code: "OUTSIDE_DHAKA" },
  });
  const outsideDhaka =
    existingOutside ??
    (await prisma.shippingZone.create({
      data: {
        name: "Outside Dhaka",
        code: "OUTSIDE_DHAKA",
        isActive: true,
        isFallback: true,
        matchDistricts: [],
      },
    }));

  const existingStandard = await prisma.shippingMethod.findUnique({
    where: { code: "STANDARD" },
  });
  const standard =
    existingStandard ??
    (await prisma.shippingMethod.create({
      data: { name: "Standard Delivery", code: "STANDARD", isActive: true },
    }));

  const existingExpress = await prisma.shippingMethod.findUnique({
    where: { code: "EXPRESS" },
  });
  const express =
    existingExpress ??
    (await prisma.shippingMethod.create({
      data: { name: "Express Delivery", code: "EXPRESS", isActive: true },
    }));

  const rates = [
    { zoneId: insideDhaka.id, methodId: standard.id, price: DEFAULT_SHIPPING_RATES.INSIDE_STANDARD },
    { zoneId: insideDhaka.id, methodId: express.id, price: DEFAULT_SHIPPING_RATES.INSIDE_EXPRESS },
    { zoneId: outsideDhaka.id, methodId: standard.id, price: DEFAULT_SHIPPING_RATES.OUTSIDE_STANDARD },
    { zoneId: outsideDhaka.id, methodId: express.id, price: DEFAULT_SHIPPING_RATES.OUTSIDE_EXPRESS },
  ];

  for (const rate of rates) {
    await prisma.shippingRate.upsert({
      where: {
        shippingZoneId_shippingMethodId: {
          shippingZoneId: rate.zoneId,
          shippingMethodId: rate.methodId,
        },
      },
      create: {
        shippingZoneId: rate.zoneId,
        shippingMethodId: rate.methodId,
        price: rate.price,
        freeShippingFrom: null,
        isActive: true,
      },
      update: {
        price: rate.price,
        freeShippingFrom: null,
        isActive: true,
      },
    });
  }

  return {
    insideDhaka,
    outsideDhaka,
    standard,
    express,
  };
};
