import { dashboardApi } from "@/lib/api/dashboard";
import type {
  Envelope,
  InvitationLookup,
  InviteStaffInput,
  InviteStaffResult,
  StaffInvitation,
  StaffInvitationStatus,
  StaffListParams,
  StaffListResult,
  StaffMember,
  UpdateStaffAccessInput,
} from "@/features/dashboard/admin/staff/types/models";

export type {
  Envelope,
  InvitationLookup,
  InviteStaffInput,
  InviteStaffResult,
  StaffInvitation,
  StaffInvitationListResult,
  StaffInvitationStatus,
  StaffListParams,
  StaffListResult,
  StaffMember,
  StaffStatus,
  UpdateStaffAccessInput,
} from "@/features/dashboard/admin/staff/types/models";

export { toStaffErrorMessage } from "@/features/dashboard/admin/staff/utils";

const noStore = { cache: "no-store" as const };

export async function fetchAdminStaff(
  params: StaffListParams = {},
): Promise<StaffListResult> {
  const res = await dashboardApi.get<Envelope<StaffListResult>>("/admin/staff", {
    ...noStore,
    params: {
      page: params.page ?? 1,
      limit: params.limit ?? 20,
      search: params.search,
      status: params.status,
    },
  });
  return res.data;
}

export async function fetchStaffInvitations(
  status?: StaffInvitationStatus,
): Promise<{ items: StaffInvitation[]; pagination: StaffListResult["pagination"] }> {
  const res = await dashboardApi.get<
    Envelope<{ items: StaffInvitation[]; pagination: StaffListResult["pagination"] }>
  >("/admin/staff/invitations", {
    ...noStore,
    params: { limit: 20, status },
  });
  return res.data;
}

export async function inviteStaff(
  input: InviteStaffInput,
): Promise<InviteStaffResult> {
  const res = await dashboardApi.post<Envelope<InviteStaffResult>>(
    "/admin/staff/invitations",
    { body: input },
  );
  return res.data;
}

export async function resendStaffInvitation(
  id: string,
): Promise<InviteStaffResult> {
  const res = await dashboardApi.post<Envelope<InviteStaffResult>>(
    `/admin/staff/invitations/${id}/resend`,
  );
  return res.data;
}

export async function revokeStaffInvitation(id: string): Promise<StaffInvitation> {
  const res = await dashboardApi.post<Envelope<StaffInvitation>>(
    `/admin/staff/invitations/${id}/revoke`,
  );
  return res.data;
}

export async function updateStaffAccess(
  id: string,
  input: UpdateStaffAccessInput,
): Promise<StaffMember> {
  const res = await dashboardApi.patch<Envelope<StaffMember>>(
    `/admin/staff/${id}/access`,
    { body: input },
  );
  return res.data;
}

export async function suspendStaff(id: string): Promise<StaffMember> {
  const res = await dashboardApi.post<Envelope<StaffMember>>(
    `/admin/staff/${id}/suspend`,
  );
  return res.data;
}

export async function reactivateStaff(id: string): Promise<StaffMember> {
  const res = await dashboardApi.post<Envelope<StaffMember>>(
    `/admin/staff/${id}/reactivate`,
  );
  return res.data;
}

export async function offboardStaff(id: string): Promise<StaffMember> {
  const res = await dashboardApi.post<Envelope<StaffMember>>(
    `/admin/staff/${id}/offboard`,
  );
  return res.data;
}

export async function lookupInvitation(
  token: string,
): Promise<InvitationLookup> {
  // POST keeps the bearer token out of URLs, proxies and access logs.
  const res = await dashboardApi.post<Envelope<InvitationLookup>>(
    "/staff/invitations/lookup",
    { body: { token }, withSession: false },
  );
  return res.data;
}

export async function acceptInvitation(input: {
  token: string;
  name?: string;
  password?: string;
}): Promise<StaffMember> {
  const res = await dashboardApi.post<Envelope<StaffMember>>(
    "/staff/invitations/accept",
    { body: input },
  );
  return res.data;
}
