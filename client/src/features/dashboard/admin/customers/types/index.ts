import type { AdminUserItem } from "./models";

export type {
  Envelope,
  UserRole,
  UserStatus,
  AdminUserVendorProfile,
  AdminUserItem,
  UserPagination,
  UserListResult,
  UserListParams,
} from "./models";

export { USER_ROLES, USER_STATUSES } from "./models";

export type UserApproveDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: AdminUserItem | null;
};

export type UserBanDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: AdminUserItem | null;
};
