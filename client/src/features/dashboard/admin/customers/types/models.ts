export type Envelope<T> = {
  success: true;
  message: string;
  data: T;
};

export const USER_ROLES = ["CUSTOMER", "ADMIN", "VENDOR"] as const;
export const USER_STATUSES = ["ACTIVE", "INACTIVE", "BLOCKED"] as const;

export type UserRole = (typeof USER_ROLES)[number];
export type UserStatus = (typeof USER_STATUSES)[number];

export type AdminUserVendorProfile = {
  shopSlug: string;
  shopName?: string | null;
  phone?: string | null;
  logo?: string | null;
  isApproved: boolean;
};

export type AdminUserItem = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  image?: string | null;
  role: UserRole;
  isApproved: boolean;
  status?: UserStatus;
  banned?: boolean | null;
  banReason?: string | null;
  banExpires?: string | null;
  emailVerified: boolean;
  createdAt: string;
  vendorProfile?: AdminUserVendorProfile | null;
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
