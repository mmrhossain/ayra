import { prisma } from "./src/lib/prisma.ts";

async function main() {
  try {
    const r = await prisma.shippingZone.findMany();
    console.log("zones", r.length);
  } catch (e) {
    console.error("FIND_ERR", e);
  }
  try {
    const r = await prisma.shippingZone.upsert({
      where: { code: "INSIDE_DHAKA" },
      create: {
        name: "Inside Dhaka",
        code: "INSIDE_DHAKA",
        isActive: true,
        isFallback: false,
        matchDistricts: ["Dhaka"],
      },
      update: {
        isActive: true,
        isFallback: false,
        matchDistricts: ["Dhaka"],
      },
    });
    console.log("upsert", r.id, r.code);
  } catch (e) {
    console.error("UPSERT_ERR", e);
  }
}

main().finally(() => process.exit(0));
