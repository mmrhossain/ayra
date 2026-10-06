import { auth } from "../src/lib/auth.ts";
import { prisma } from "../src/lib/prisma.ts";
import { ORDER_CONFIRMATION_TEMPLATE } from "../src/template/order-confirmation.ts";
import { PAYMENT_CONFIRMATION_TEMPLATE } from "../src/template/payment-confirmation.ts";

const ROLES = ["CUSTOMER", "ADMIN", "VENDOR"] as const;

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? process.env.ADMIN_EMAIL;
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    throw new Error(
      "SEED_ADMIN_EMAIL (or ADMIN_EMAIL) and SEED_ADMIN_PASSWORD are required"
    );
  }

  if (adminPassword.length < 8) {
    throw new Error("SEED_ADMIN_PASSWORD must be at least 8 characters");
  }

  let user = await prisma.user.findUnique({ where: { email: adminEmail } });

  if (!user) {
    const result = await auth.api.signUpEmail({
      body: {
        email: adminEmail,
        password: adminPassword,
        name: "Admin",
      },
    });

    const createdId = result.user?.id;
    if (!createdId) {
      throw new Error("Better Auth signUpEmail did not return a user id");
    }

    user = await prisma.user.update({
      where: { id: createdId },
      data: {
        role: "ADMIN",
        emailVerified: true,
        isApproved: true,
      },
    });

    console.log(`[seed] admin user created: ${adminEmail}`);
  } else {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        role: "ADMIN",
        emailVerified: true,
        isApproved: true,
      },
    });
    console.log(`[seed] admin user already exists: ${adminEmail}`);
  }

  console.log("[seed] roles ready:", ROLES.join(", "));

  const existingWarehouse = await prisma.warehouse.findFirst({
    where: { code: "MAIN", deletedAt: null },
  });

  if (!existingWarehouse) {
    await prisma.warehouse.create({
      data: {
        name: "Main Warehouse",
        code: "MAIN",
        country: "Bangladesh",
        city: "Dhaka",
        addressLine1: "1 Main Road",
        isActive: true,
      },
    });
    console.log("[seed] default warehouse created: MAIN");
  } else {
    console.log("[seed] default warehouse already exists: MAIN");
  }

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
      matchDistricts: ["Dhaka"],
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
    { zoneId: insideDhaka.id, methodId: standard.id, price: 60 },
    { zoneId: insideDhaka.id, methodId: express.id, price: 120 },
    { zoneId: outsideDhaka.id, methodId: standard.id, price: 120 },
    { zoneId: outsideDhaka.id, methodId: express.id, price: 200 },
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
        isActive: true,
      },
      update: {
        price: rate.price,
        isActive: true,
      },
    });
  }

  console.log("[seed] shipping catalog ready: Inside/Outside Dhaka + Standard/Express");

  for (const template of [
    ORDER_CONFIRMATION_TEMPLATE,
    PAYMENT_CONFIRMATION_TEMPLATE,
  ]) {
    await prisma.notificationTemplate.upsert({
      where: { code: template.code },
      create: {
        code: template.code,
        name: template.name,
        channel: template.channel,
        subject: template.subject,
        content: template.content,
        variables: template.variables,
        isActive: true,
      },
      update: {
        name: template.name,
        channel: template.channel,
        subject: template.subject,
        content: template.content,
        variables: template.variables,
        isActive: true,
      },
    });
    console.log(`[seed] notification template ready: ${template.code}`);
  }
}

main()
  .catch((err) => {
    console.error("[seed] failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
