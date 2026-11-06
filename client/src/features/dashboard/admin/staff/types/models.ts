import type {
  AdminAction,
  AdminPermission,
} from "@/lib/admin-permissions";

export type { Envelope } from "@/lib/api/http";

export type StaffStatus = "ACTIVE" | "SUSPENDED" | "OFFBOARDED";

export type StaffMember = {
  id: string;
  name: string;
  email: string;
  role: string | null;
  adminPermissions: AdminPermission[];
  adminActions: AdminAction[];
  isSuperAdmin: boolean;
  status: StaffStatus | "SUSPENDED";
  banned: boolean;
  banReason: string | null;
  createdAt: string;
  updatedAt: string;
};

export type StaffInvitationStatus =
  | "PENDING"
  | "ACCEPTED"
  | "REVOKED"
  | "EXPIRED";

export type StaffInvitation = {
  id: string;
  email: string;
  name: string;
  permissions: AdminPermission[];
  isSuperAdmin: boolean;
  status: StaffInvitationStatus;
  expiresAt: string;
  invitedById: string;
  acceptedAt: string | null;
  revokedAt: string | null;
  lastSentAt: string;
  createdAt: string;
};

export type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type StaffListResult = {
  items: StaffMember[];
  pagination: Pagination;
  canManage: boolean;
  canInvite: boolean;
  canSuspend: boolean;
  currentUserId: string;
};

export type StaffInvitationListResult = {
  items: StaffInvitation[];
  pagination: Pagination;
};

export type InviteStaffInput = {
  email: string;
  name: string;
  permissions: AdminPermission[];
  isSuperAdmin: boolean;
};

export type InviteStaffResult = {
  invitation: StaffInvitation;
  /** Only present outside production, for local/test previews. */
  token?: string;
};

export type UpdateStaffAccessInput = {
  permissions: AdminPermission[];
  actions?: AdminAction[];
  isSuperAdmin?: boolean;
};

export type InvitationLookup = {
  id: string;
  email: string;
  name: string;
  status: StaffInvitationStatus;
  expiresAt: string;
};

export type StaffListParams = {
  page?: number;
  limit?: number;
  search?: string;
  status?: StaffStatus;
};
