import { prisma, transaction } from "../../../lib/prisma.ts";
import { AppError } from "../../../common/errors/AppError.ts";
import type {
  CreateAddressInput,
  DefaultAddressFlags,
  UpdateAddressInput,
} from "../types.ts";

const findOwnedAddress = async (customerProfileId: string, id: string) => {
  const address = await prisma.address.findFirst({
    where: { id, customerProfileId },
  });

  if (!address) throw new AppError("Address not found", 404);

  return address;
};

const applyDefaultFlags = async (
  tx: Parameters<Parameters<typeof transaction>[0]>[0],
  customerProfileId: string,
  addressId: string,
  flags: DefaultAddressFlags
) => {
  if (flags.isDefaultShipping === true) {
    await tx.address.updateMany({
      where: {
        customerProfileId,
        id: { not: addressId },
        isDefaultShipping: true,
      },
      data: { isDefaultShipping: false },
    });
  }

  if (flags.isDefaultBilling === true) {
    await tx.address.updateMany({
      where: {
        customerProfileId,
        id: { not: addressId },
        isDefaultBilling: true,
      },
      data: { isDefaultBilling: false },
    });
  }
};

export const createAddress = async (
  customerProfileId: string,
  input: CreateAddressInput
) => {
  return transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "CustomerProfile" WHERE id = ${customerProfileId} FOR UPDATE`;

    const address = await tx.address.create({
      data: {
        customerProfileId,
        label: input.label ?? null,
        fullName: input.fullName,
        phone: input.phone,
        email: input.email ?? null,
        country: input.country,
        division: input.division,
        district: input.district,
        thana: input.thana ?? null,
        area: input.area ?? null,
        postalCode: input.postalCode ?? null,
        addressLine1: input.addressLine1,
        addressLine2: input.addressLine2 ?? null,
        isDefaultShipping: input.isDefaultShipping ?? false,
        isDefaultBilling: input.isDefaultBilling ?? false,
      },
    });

    await applyDefaultFlags(tx, customerProfileId, address.id, {
      ...(input.isDefaultShipping !== undefined && {
        isDefaultShipping: input.isDefaultShipping,
      }),
      ...(input.isDefaultBilling !== undefined && {
        isDefaultBilling: input.isDefaultBilling,
      }),
    });

    return address;
  });
};

export const listAddresses = async (customerProfileId: string) => {
  return prisma.address.findMany({
    where: { customerProfileId },
    orderBy: { createdAt: "desc" },
  });
};

export const getAddress = async (customerProfileId: string, id: string) => {
  return findOwnedAddress(customerProfileId, id);
};

export const updateAddress = async (
  customerProfileId: string,
  id: string,
  input: UpdateAddressInput
) => {
  return transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "CustomerProfile" WHERE id = ${customerProfileId} FOR UPDATE`;

    const existing = await tx.address.findFirst({
      where: { id, customerProfileId },
    });

    if (!existing) throw new AppError("Address not found", 404);

    const updated = await tx.address.update({
      where: { id },
      data: {
        ...(input.label !== undefined && { label: input.label ?? null }),
        ...(input.fullName !== undefined && { fullName: input.fullName }),
        ...(input.phone !== undefined && { phone: input.phone }),
        ...(input.email !== undefined && { email: input.email ?? null }),
        ...(input.country !== undefined && { country: input.country }),
        ...(input.division !== undefined && { division: input.division }),
        ...(input.district !== undefined && { district: input.district }),
        ...(input.thana !== undefined && { thana: input.thana ?? null }),
        ...(input.area !== undefined && { area: input.area ?? null }),
        ...(input.postalCode !== undefined && {
          postalCode: input.postalCode ?? null,
        }),
        ...(input.addressLine1 !== undefined && {
          addressLine1: input.addressLine1,
        }),
        ...(input.addressLine2 !== undefined && {
          addressLine2: input.addressLine2 ?? null,
        }),
        ...(input.isDefaultShipping !== undefined && {
          isDefaultShipping: input.isDefaultShipping,
        }),
        ...(input.isDefaultBilling !== undefined && {
          isDefaultBilling: input.isDefaultBilling,
        }),
      },
    });

    await applyDefaultFlags(tx, customerProfileId, id, {
      ...(input.isDefaultShipping !== undefined && {
        isDefaultShipping: input.isDefaultShipping,
      }),
      ...(input.isDefaultBilling !== undefined && {
        isDefaultBilling: input.isDefaultBilling,
      }),
    });

    return updated;
  });
};

export const deleteAddress = async (customerProfileId: string, id: string) => {
  const existing = await findOwnedAddress(customerProfileId, id);

  await prisma.address.delete({ where: { id: existing.id } });

  return { deleted: true };
};
