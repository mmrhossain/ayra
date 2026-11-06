"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  acceptInvitation,
  fetchAdminStaff,
  fetchStaffInvitations,
  inviteStaff,
  offboardStaff,
  reactivateStaff,
  resendStaffInvitation,
  revokeStaffInvitation,
  suspendStaff,
  updateStaffAccess,
} from "@/features/dashboard/admin/staff/api/staff";
import { toStaffErrorMessage } from "@/features/dashboard/admin/staff/utils";
import type {
  InviteStaffInput,
  InviteStaffResult,
  StaffListParams,
  StaffListResult,
  UpdateStaffAccessInput,
} from "@/features/dashboard/admin/staff/types/models";

const STAFF_KEY = ["admin-staff"] as const;
const INVITATION_KEY = ["admin-staff-invitations"] as const;

export function useStaffList({
  initialData,
  params,
}: {
  initialData: StaffListResult;
  params: StaffListParams;
}) {
  const query = useQuery({
    queryKey: [...STAFF_KEY, params],
    queryFn: () => fetchAdminStaff(params),
    initialData:
      (params.page ?? 1) === 1 && !params.search && !params.status
        ? initialData
        : undefined,
    placeholderData: keepPreviousData,
    staleTime: 15_000,
  });

  return { query, data: query.data ?? initialData };
}

export function useStaffInvitations(enabled = true) {
  return useQuery({
    queryKey: INVITATION_KEY,
    queryFn: () => fetchStaffInvitations(),
    enabled,
    staleTime: 15_000,
  });
}

function useStaffMutation<TArgs, TResult = unknown>(
  mutationFn: (args: TArgs) => Promise<TResult>,
  successMessage: string,
  onSuccess?: () => void,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: STAFF_KEY });
      void queryClient.invalidateQueries({ queryKey: INVITATION_KEY });
      toast.success(successMessage);
      onSuccess?.();
    },
    onError: (err) => toast.error(toStaffErrorMessage(err)),
  });
}

export function useInviteStaff(onSuccess?: () => void) {
  return useStaffMutation<InviteStaffInput, InviteStaffResult>(
    inviteStaff,
    "Invitation sent",
    onSuccess,
  );
}

export function useResendInvitation(onSuccess?: () => void) {
  return useStaffMutation<string, InviteStaffResult>(
    resendStaffInvitation,
    "Invitation resent",
    onSuccess,
  );
}

export function useRevokeInvitation(onSuccess?: () => void) {
  return useStaffMutation<string>(
    revokeStaffInvitation,
    "Invitation revoked",
    onSuccess,
  );
}

export function useUpdateStaffAccess(onSuccess?: () => void) {
  return useStaffMutation<{ id: string; input: UpdateStaffAccessInput }>(
    ({ id, input }) => updateStaffAccess(id, input),
    "Staff access updated",
    onSuccess,
  );
}

export function useSuspendStaff(onSuccess?: () => void) {
  return useStaffMutation<string>(suspendStaff, "Staff member suspended", onSuccess);
}

export function useReactivateStaff(onSuccess?: () => void) {
  return useStaffMutation<string>(reactivateStaff, "Staff member reactivated", onSuccess);
}

export function useOffboardStaff(onSuccess?: () => void) {
  return useStaffMutation<string>(offboardStaff, "Staff member offboarded", onSuccess);
}

export function useAcceptInvitation(onSuccess?: () => void) {
  return useMutation({
    mutationFn: acceptInvitation,
    onSuccess: () => {
      toast.success("Invitation accepted");
      onSuccess?.();
    },
    onError: (err) => toast.error(toStaffErrorMessage(err)),
  });
}
