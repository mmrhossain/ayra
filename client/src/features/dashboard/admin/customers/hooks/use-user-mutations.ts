"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  approveUser,
  banUser,
  toUserErrorMessage,
  unbanUser,
  type AdminUserItem,
} from "@/features/dashboard/admin/customers/api/customer";

function invalidateUserQueries(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ["users"] });
  queryClient.invalidateQueries({ queryKey: ["admin-users"] });
  queryClient.invalidateQueries({ queryKey: ["admin-vendors"] });
}

export function useUserApproveMutation({
  user,
  approve,
  onSuccess,
}: {
  user: AdminUserItem | null;
  approve: boolean;
  onSuccess: () => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Missing user");
      await approveUser(user.id, approve);
    },
    onSuccess: () => {
      invalidateUserQueries(queryClient);
      toast.success(approve ? "User approved" : "User approval revoked");
      onSuccess();
    },
    onError: (err) => {
      toast.error(toUserErrorMessage(err));
    },
  });
}

export function useUserBanMutation({
  user,
  ban,
  onSuccess,
}: {
  user: AdminUserItem | null;
  ban: boolean;
  onSuccess: () => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { banReason: string; expiryDays: string }) => {
      if (!user) throw new Error("Missing user");
      if (ban) {
        const days = Number(input.expiryDays);
        return banUser(user.id, {
          banReason: input.banReason.trim() || undefined,
          banExpiresIn:
            Number.isFinite(days) && days > 0
              ? Math.trunc(days) * 24 * 60 * 60
              : undefined,
        });
      }
      return unbanUser(user.id);
    },
    onSuccess: () => {
      invalidateUserQueries(queryClient);
      toast.success(ban ? "User banned" : "User unbanned");
      onSuccess();
    },
    onError: (err) => {
      toast.error(toUserErrorMessage(err));
    },
  });
}
