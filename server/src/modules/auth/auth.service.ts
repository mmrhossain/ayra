import { prisma, transaction } from "../../lib/prisma.ts";
import { auth } from "../../lib/auth.ts";
import { AppError } from "../../common/errors/AppError.ts";
import { paginated } from "../../common/utils/paginate.ts";
import { isPrismaCode } from "../../common/utils/prisma-error.ts";
import { resolveImagePublicId } from "../../common/utils/cloudinary-public-id.ts";
import { attachMediaAssets } from "../media/media.service.ts";
import { APIError } from "better-auth/api";
import type { Prisma } from "../../generated/prisma/client.ts";
import type {
  AdminListUsersQuery,
  BanUserInput,
  VendorApplyInput,
} from "./types.ts";

export const applyAsVendor = async (userId: string, input: VendorApplyInput) => {
  try {
    const vendorProfile = await transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: userId } });

      if (!user) {
        throw new AppError("User not found", 404);
      }

      const existing = await tx.vendorProfile.findUnique({
        where: { userId },
      });

      if (existing) {
        throw new AppError("Vendor application already submitted", 409);
      }

      return tx.vendorProfile.create({
        data: {
          shopName: input.shopName,
          shopSlug: input.shopSlug,
          description: input.description ?? null,
          logo: input.logo ?? null,
          logoPublicId: resolveImagePublicId(input.logoPublicId, input.logo),
          userId,
          isApproved: false,
        },
      });
    });

    await attachMediaAssets(
      [vendorProfile.logoPublicId],
      "vendor_profile",
      vendorProfile.id
    );

    return vendorProfile;
  } catch (err) {
    if (isPrismaCode(err, "P2002")) {
      const target = (err as { meta?: { target?: string[] } }).meta?.target ?? [];
      if (target.includes("userId")) {
        throw new AppError("Vendor application already submitted", 409);
      }
      throw new AppError("Shop slug already exists", 409);
    }
    throw err;
  }
};

const toUserStatus = (user: {
  banned?: boolean | null | undefined;
  emailVerified?: boolean | null | undefined;
}): "ACTIVE" | "INACTIVE" | "BLOCKED" => {
  if (user.banned === true) return "BLOCKED";
  if (user.emailVerified === false) return "INACTIVE";
  return "ACTIVE";
};

const serializeAdminUser = (
  user: {
    id: string;
    name: string;
    email: string;
    image?: string | null | undefined;
    role?: string | null | undefined;
    banned?: boolean | null | undefined;
    banReason?: string | null | undefined;
    banExpires?: Date | string | null | undefined;
    emailVerified: boolean;
    createdAt: Date | string;
  },
  vendorProfile?: {
    shopSlug: string;
    shopName: string | null;
    phone: string | null;
    logo: string | null;
    isApproved: boolean;
  } | null,
) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  phone: vendorProfile?.phone ?? null,
  image: user.image ?? null,
  role: user.role ?? "CUSTOMER",
  isApproved: vendorProfile?.isApproved ?? false,
  status: toUserStatus(user),
  banned: user.banned ?? false,
  banReason: user.banReason ?? null,
  banExpires:
    user.banExpires instanceof Date
      ? user.banExpires.toISOString()
      : user.banExpires ?? null,
  emailVerified: user.emailVerified,
  createdAt:
    user.createdAt instanceof Date
      ? user.createdAt.toISOString()
      : user.createdAt,
  vendorProfile: vendorProfile
    ? {
        shopSlug: vendorProfile.shopSlug,
        shopName: vendorProfile.shopName,
        phone: vendorProfile.phone,
        logo: vendorProfile.logo,
        isApproved: vendorProfile.isApproved,
      }
    : null,
});

const vendorProfileSelect = {
  userId: true,
  shopSlug: true,
  shopName: true,
  phone: true,
  logo: true,
  isApproved: true,
} as const;

const statusWhere = (status?: "ACTIVE" | "INACTIVE" | "BLOCKED") => {
  if (status === "BLOCKED") return { banned: true };
  if (status === "INACTIVE") return { emailVerified: false, banned: { not: true } };
  if (status === "ACTIVE") return { emailVerified: true, banned: { not: true } };
  return {};
};

const listUsersWithPrisma = async (query: AdminListUsersQuery) => {
  const where: Prisma.UserWhereInput = {
    ...(query.role === "VENDOR"
      ? { vendorProfile: { is: { deletedAt: null } } }
      : query.role
        ? { role: query.role }
        : {}),
    ...statusWhere(query.status),
    ...(query.searchValue && query.searchField
      ? {
          [query.searchField]: {
            contains: query.searchValue,
            mode: "insensitive" as const,
          },
        }
      : {}),
  };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      include: { vendorProfile: { select: vendorProfileSelect } },
      orderBy: { createdAt: query.sortDirection === "asc" ? "asc" : "desc" },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    }),
    prisma.user.count({ where }),
  ]);

  return paginated(
    users.map((user) => serializeAdminUser(user, user.vendorProfile)),
    query.page,
    query.limit,
    total,
  );
};

export const listUsers = async (
  query: AdminListUsersQuery,
  headers: Headers
) => {
  const usePrisma = query.role === "VENDOR" || query.status !== undefined;

  if (usePrisma) {
    return listUsersWithPrisma(query);
  }

  try {
    const offset = (query.page - 1) * query.limit;
    const mappedFilter =
      query.filterField === undefined && query.role
        ? {
            filterField: "role",
            filterValue: query.role,
            filterOperator: "eq" as const,
          }
        : query.filterField === undefined && query.status === "BLOCKED"
          ? {
              filterField: "banned",
              filterValue: true,
              filterOperator: "eq" as const,
            }
          : query.filterField === undefined && query.status === "INACTIVE"
            ? {
                filterField: "emailVerified",
                filterValue: false,
                filterOperator: "eq" as const,
              }
            : {};

    const result = await auth.api.listUsers({
      query: {
        limit: query.limit,
        offset,
        sortBy: query.sortBy ?? "createdAt",
        sortDirection: query.sortDirection ?? "desc",
        ...(query.searchValue !== undefined && { searchValue: query.searchValue }),
        ...(query.searchField !== undefined && { searchField: query.searchField }),
        ...(query.searchOperator !== undefined && {
          searchOperator: query.searchOperator,
        }),
        ...(query.filterField !== undefined && { filterField: query.filterField }),
        ...(query.filterValue !== undefined && { filterValue: query.filterValue }),
        ...(query.filterOperator !== undefined && {
          filterOperator: query.filterOperator,
        }),
        ...mappedFilter,
      },
      headers,
    });

    const users = result.users ?? [];
    const profiles =
      users.length === 0
        ? []
        : await prisma.vendorProfile.findMany({
            where: { userId: { in: users.map((user) => user.id) }, deletedAt: null },
            select: vendorProfileSelect,
          });
    const profileByUserId = new Map(profiles.map((row) => [row.userId, row]));

    return paginated(
      users.map((user) => serializeAdminUser(user, profileByUserId.get(user.id))),
      query.page,
      query.limit,
      result.total ?? 0,
    );
  } catch (err) {
    return mapAuthApiError(err);
  }
};

export const getUser = async (userId: string, headers: Headers) => {
  try {
    const user = await auth.api.getUser({
      query: { id: userId },
      headers,
    });
    const vendorProfile = await prisma.vendorProfile.findFirst({
      where: { userId, deletedAt: null },
      select: vendorProfileSelect,
    });
    return serializeAdminUser(user, vendorProfile);
  } catch (err) {
    return mapAuthApiError(err);
  }
};

export const approveUser = async (userId: string, isApproved: boolean) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { vendorProfile: true },
  });

  if (!user) {
    throw new AppError("User not found", 404);
  }

  const nextRole =
    isApproved && user.vendorProfile
      ? "VENDOR"
      : user.role === "VENDOR" && !isApproved
        ? "CUSTOMER"
        : user.role;

  const { updatedUser, vendorProfile } = await transaction(async (tx) => {
    const updatedUser = await tx.user.update({
      where: { id: userId },
      data: { role: nextRole },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        banned: true,
        banReason: true,
        banExpires: true,
        emailVerified: true,
        createdAt: true,
      },
    });

    const vendorProfile = user.vendorProfile
      ? await tx.vendorProfile.update({
          where: { userId },
          data: { isApproved },
          select: vendorProfileSelect,
        })
      : null;

    return { updatedUser, vendorProfile };
  });

  return serializeAdminUser(updatedUser, vendorProfile);
};

const mapAuthApiError = (err: unknown): never => {
  if (err instanceof APIError) {
    const status =
      typeof err.status === "number"
        ? err.status
        : err.status === "UNAUTHORIZED"
          ? 401
          : err.status === "FORBIDDEN"
            ? 403
            : err.status === "NOT_FOUND"
              ? 404
              : 400;
    throw new AppError(err.message || "Auth request failed", status);
  }
  throw err;
};

export const banUser = async (
  userId: string,
  input: BanUserInput,
  headers: Headers
) => {
  try {
    return await auth.api.banUser({
      body: {
        userId,
        ...(input.banReason !== undefined && { banReason: input.banReason }),
        ...(input.banExpiresIn !== undefined && {
          banExpiresIn: input.banExpiresIn,
        }),
      },
      headers,
    });
  } catch (err) {
    return mapAuthApiError(err);
  }
};

export const unbanUser = async (userId: string, headers: Headers) => {
  try {
    return await auth.api.unbanUser({
      body: { userId },
      headers,
    });
  } catch (err) {
    return mapAuthApiError(err);
  }
};
