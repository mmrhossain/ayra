import { prisma } from "../../../lib/prisma.ts";
import { AppError } from "../../../common/errors/AppError.ts";
import { getOrCreateCustomerProfile } from "../../../common/utils/customerProfile.ts";
import { resolveImagePublicId } from "../../../common/utils/cloudinary-public-id.ts";
import { attachMediaAssets, deleteImages } from "../../media/media.service.ts";
import type {
  UpdateCustomerProfileInput,
  UpdateVendorProfileInput,
} from "../types.ts";

const customerProfileSelect = {
  id: true,
  customerCode: true,
  dateOfBirth: true,
  gender: true,
  loyaltyPoints: true,
  totalOrders: true,
  totalSpent: true,
  facebookId: true,
  googleId: true,
  appleId: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
  user: {
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      emailVerified: true,
      createdAt: true,
    },
  },
} as const;

export const getCustomerProfile = async (userId: string) => {
  const profile = await getOrCreateCustomerProfile(userId);

  return prisma.customerProfile.findUniqueOrThrow({
    where: { id: profile.id },
    select: customerProfileSelect,
  });
};

export const saveCustomerProfile = async (
  userId: string,
  input: UpdateCustomerProfileInput
) => {
  const profile = await getOrCreateCustomerProfile(userId);

  return prisma.customerProfile.update({
    where: { id: profile.id },
    data: {
      ...(input.dateOfBirth !== undefined && { dateOfBirth: input.dateOfBirth }),
      ...(input.gender !== undefined && { gender: input.gender }),
    },
    select: customerProfileSelect,
  });
};

export const updateCustomerProfile = saveCustomerProfile;

const vendorProfileSelect = {
  id: true,
  shopName: true,
  shopSlug: true,
  description: true,
  logo: true,
  logoPublicId: true,
  phone: true,
  isApproved: true,
  createdAt: true,
  updatedAt: true,
} as const;

export const getVendorProfile = async (userId: string) => {
  const profile = await prisma.vendorProfile.findUnique({
    where: { userId },
    select: vendorProfileSelect,
  });

  if (!profile) throw new AppError("Vendor profile not found", 404);

  return profile;
};

export const updateVendorProfile = async (
  userId: string,
  input: UpdateVendorProfileInput
) => {
  const profile = await prisma.vendorProfile.findUnique({
    where: { userId },
  });

  if (!profile) throw new AppError("Vendor profile not found", 404);

  const nextLogo = input.logo !== undefined ? input.logo : profile.logo;
  const nextPublicId =
    input.logo !== undefined || input.logoPublicId !== undefined
      ? resolveImagePublicId(
          input.logoPublicId ?? profile.logoPublicId,
          nextLogo
        )
      : profile.logoPublicId;

  const updated = await prisma.vendorProfile.update({
    where: { userId },
    data: {
      ...(input.shopName !== undefined && { shopName: input.shopName }),
      ...(input.description !== undefined && {
        description: input.description ?? null,
      }),
      ...(input.logo !== undefined && { logo: input.logo }),
      ...((input.logo !== undefined || input.logoPublicId !== undefined) && {
        logoPublicId: nextPublicId,
      }),
      ...(input.phone !== undefined && { phone: input.phone }),
    },
    select: vendorProfileSelect,
  });

  const previousPublicId = resolveImagePublicId(
    profile.logoPublicId,
    profile.logo
  );
  if (previousPublicId && previousPublicId !== nextPublicId) {
    await deleteImages([previousPublicId]);
  }
  await attachMediaAssets([nextPublicId], "vendor_profile", updated.id);

  return updated;
};
