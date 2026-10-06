import { randomUUID } from "node:crypto";
import { prisma } from "../../lib/prisma.ts";
import { AppError } from "../errors/AppError.ts";
import { isPrismaCode } from "./prisma-error.ts";

const generateCustomerCode = () => {
  const suffix = randomUUID().replace(/-/g, "").slice(0, 10).toUpperCase();
  return `CUST-${suffix}`;
};

export const getOrCreateCustomerProfile = async (userId: string) => {
  const userExists = await prisma.user.findUnique({ where: { id: userId } });
  if (!userExists) {
    throw new AppError("User account not found in database", 404);
  }
  const customerProfile = await prisma.customerProfile.findUnique({ where: { userId } });

  if (customerProfile) return customerProfile;

  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      return await prisma.customerProfile.create({
        data: {
          userId,
          customerCode: generateCustomerCode(),
        },
      });
    } catch (err) {
      if (isPrismaCode(err, "P2002")) {
        const raced = await prisma.customerProfile.findUnique({ where: { userId } });
        if (raced) return raced;
        continue;
      }
      throw err;
    }
  }

  throw new Error("Unable to allocate a unique customer code");
};
