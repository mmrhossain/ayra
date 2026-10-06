import { dashboardApi } from "@/lib/api/dashboard";
import type {
  AdminUserItem,
  Envelope,
  UserListParams,
  UserListResult,
} from "@/features/dashboard/admin/customers/types";

export type {
  AdminUserItem,
  AdminUserVendorProfile,
  Envelope,
  UserListParams,
  UserListResult,
  UserPagination,
  UserRole,
  UserStatus,
} from "@/features/dashboard/admin/customers/types";

export { USER_ROLES, USER_STATUSES } from "@/features/dashboard/admin/customers/types";

export {
  isUserBanned,
  parseUserRole,
  parseUserStatus,
  toUserErrorMessage,
} from "@/features/dashboard/admin/customers/utils";

const noStore = { cache: "no-store" as const };

export async function fetchAdminUserList(
  params: UserListParams = {},
): Promise<UserListResult> {
  const res = await dashboardApi.get<Envelope<UserListResult>>(
    "/admin/users",
    {
      ...noStore,
      params: {
        page: params.page ?? 1,
        limit: params.limit ?? 20,
        role: params.role,
        status: params.status,
      },
    },
  );
  return res.data;
}

export async function approveUser(
  id: string,
  isApproved: boolean,
): Promise<AdminUserItem> {
  const res = await dashboardApi.post<Envelope<AdminUserItem>>(
    `/admin/users/${id}/approve`,
    { body: { isApproved } },
  );
  return res.data;
}

export async function banUser(
  id: string,
  input: { banReason?: string; banExpiresIn?: number } = {},
): Promise<AdminUserItem> {
  const body: { banReason?: string; banExpiresIn?: number } = {};
  if (input.banReason) body.banReason = input.banReason;
  if (input.banExpiresIn) body.banExpiresIn = input.banExpiresIn;
  const res = await dashboardApi.patch<Envelope<AdminUserItem>>(
    `/admin/users/${id}/ban`,
    { body },
  );
  return res.data;
}

export async function unbanUser(id: string): Promise<AdminUserItem> {
  const res = await dashboardApi.patch<Envelope<AdminUserItem>>(
    `/admin/users/${id}/unban`,
  );
  return res.data;
}
