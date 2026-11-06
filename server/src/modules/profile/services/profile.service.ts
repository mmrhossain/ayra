import { getOrCreateCustomerProfile } from "../../../common/utils/customerProfile.ts";
import { prisma } from "../../../lib/prisma.ts";
import type {
  UpdateCustomerProfileInput,
  UpdateNotificationPreferencesInput,
} from "../types.ts";

const customerProfileSelect = {
  id: true,
  customerCode: true,
  dateOfBirth: true,
  gender: true,
  loyaltyPoints: true,
  totalOrders: true,
  totalSpent: true,
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

export const saveCustomerProfile = async (userId: string, input: UpdateCustomerProfileInput) => {
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

const notificationPreferenceSelect = {
  emailEnabled: true,
  pushEnabled: true,
  smsEnabled: true,
  updatedAt: true,
} as const;

const DEFAULT_NOTIFICATION_PREFERENCES = {
  emailEnabled: true,
  pushEnabled: true,
  smsEnabled: false,
  updatedAt: null,
};

export const getNotificationPreferences = async (userId: string) => {
  const preferences = await prisma.userNotificationPreference.findUnique({
    where: { userId },
    select: notificationPreferenceSelect,
  });

  return preferences ?? DEFAULT_NOTIFICATION_PREFERENCES;
};

export const saveNotificationPreferences = async (
  userId: string,
  input: UpdateNotificationPreferencesInput,
) => {
  return prisma.userNotificationPreference.upsert({
    where: { userId },
    create: {
      userId,
      emailEnabled: input.emailEnabled ?? true,
      pushEnabled: input.pushEnabled ?? true,
      smsEnabled: input.smsEnabled ?? false,
    },
    update: {
      ...(input.emailEnabled !== undefined && {
        emailEnabled: input.emailEnabled,
      }),
      ...(input.pushEnabled !== undefined && {
        pushEnabled: input.pushEnabled,
      }),
      ...(input.smsEnabled !== undefined && { smsEnabled: input.smsEnabled }),
    },
    select: notificationPreferenceSelect,
  });
};
