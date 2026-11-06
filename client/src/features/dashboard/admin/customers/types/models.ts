export type { Envelope } from "@/lib/api/http";

export const USER_ROLES = ["CUSTOMER", "ADMIN"] as const;
export const USER_STATUSES = ["ACTIVE", "INACTIVE", "BLOCKED"] as const;

export type UserRole = (typeof USER_ROLES)[number];
export type UserStatus = (typeof USER_STATUSES)[number];

export type AdminUserItem = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  image?: string | null;
  role: UserRole;
  status?: UserStatus;
  banned?: boolean | null;
  banReason?: string | null;
  banExpires?: string | null;
  emailVerified: boolean;
  createdAt: string;
};

export type UserPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type UserListResult = {
  items: AdminUserItem[];
  pagination: UserPagination;
};

export type UserListParams = {
  page?: number;
  limit?: number;
  role?: UserRole;
  status?: UserStatus;
};
