import { prisma } from "../../lib/prisma.ts";
import { AppError } from "../errors/AppError.ts";
import { isPrismaCode } from "./prisma-error.ts";
import { isStaffRole, STAFF_CANNOT_SHOP_MESSAGE } from "./roles.ts";

export const formatCustomerCode = (reference: bigint, now = new Date()) => {
  if (reference < 1n) throw new RangeError("Customer reference must be positive");
  // Match the existing order number date convention (YYMMDD, UTC).
  const date = now.toISOString().slice(2, 10).replace(/-/g, "");
  return "CUST-" + date + "-" + reference.toString().padStart(3, "0");
};

const generateCustomerCode = async () => {
  const [row] = await prisma.$queryRaw<Array<{ reference: bigint }>>`
    SELECT nextval('public.customer_public_reference_seq') AS reference
  `;
  if (!row) throw new Error("Unable to allocate a customer reference");
  return formatCustomerCode(row.reference);
};

export const getOrCreateCustomerProfile = async (
  userId: string,
  verifiedUser?: { id: string; role?: string | null | undefined },
) => {
  const userExists = verifiedUser?.id === userId
    ? verifiedUser
    : await prisma.user.findUnique({ where: { id: userId } });
  if (!userExists) {
    throw new AppError("User account not found in database", 404);
  }
  if (isStaffRole(userExists.role)) {
    throw new AppError(STAFF_CANNOT_SHOP_MESSAGE, 403);
  }
  const customerProfile = await prisma.customerProfile.findUnique({ where: { userId } });

  if (customerProfile) return customerProfile;

  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      return await prisma.customerProfile.create({
        data: {
          userId,
          customerCode: await generateCustomerCode(),
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
