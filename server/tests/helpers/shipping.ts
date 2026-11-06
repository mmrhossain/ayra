import { prisma } from "../../src/lib/prisma.ts";

export const DEFAULT_SHIPPING_RATES = {
  INSIDE_STANDARD: 60,
  INSIDE_EXPRESS: 120,
  OUTSIDE_STANDARD: 120,
  OUTSIDE_EXPRESS: 200,
} as const;

export const ensureDefaultShippingCatalog = async () => {
  const insideDhaka = await prisma.shippingZone.upsert({
    where: { code: "INSIDE_DHAKA" },
    create: {
      name: "Inside Dhaka",
      code: "INSIDE_DHAKA",
      isActive: true,
      isFallback: false,
      matchDistricts: ["Dhaka"],
    },
    update: {
      name: "Inside Dhaka",
      isActive: true,
      isFallback: false,
      matchDistricts: ["Dhaka"],
      matchDistrictCodes: [],
    },
  });

  const outsideDhaka = await prisma.shippingZone.upsert({
    where: { code: "OUTSIDE_DHAKA" },
    create: {
      name: "Outside Dhaka",
      code: "OUTSIDE_DHAKA",
      isActive: true,
      isFallback: true,
      matchDistricts: [],
    },
    update: {
      name: "Outside Dhaka",
      isActive: true,
      isFallback: true,
      matchDistricts: [],
      matchDistrictCodes: [],
    },
  });

  const standard = await prisma.shippingMethod.upsert({
    where: { code: "STANDARD" },
    create: { name: "Standard Delivery", code: "STANDARD", isActive: true },
    update: { name: "Standard Delivery", isActive: true },
  });

  const express = await prisma.shippingMethod.upsert({
    where: { code: "EXPRESS" },
    create: { name: "Express Delivery", code: "EXPRESS", isActive: true },
    update: { name: "Express Delivery", isActive: true },
  });

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
