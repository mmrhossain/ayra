"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  fetchCustomerProfile,
  saveCustomerProfile,
} from "@/features/dashboard/customer/account/api/profile";
import type { AccountFormValues } from "@/features/dashboard/customer/account/schemas";
import type { CustomerProfile } from "@/features/dashboard/customer/account/types";
import { isCustomerGender, toProfileError } from "@/features/dashboard/customer/account/utils";
import { authClient } from "@/lib/api/auth/auth-client";

/**
 * Customer Account Profile Query Hook
 */
export function useAccount({ initialData }: { initialData: CustomerProfile }) {
  const query = useQuery({
    queryKey: ["customer-account"],
    queryFn: fetchCustomerProfile,
    initialData,
    staleTime: 30_000,
  });

  return {
    query,
    profile: query.data ?? initialData,
  };
}

/**
 * Customer Account Profile Save Mutation Hook
 */
export function useAccountSaveMutation({
  imageUrl,
  onSuccess,
}: {
  profile: CustomerProfile;
  imageUrl: string;
  onSuccess: () => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (values: AccountFormValues) => {
      const nextImage = values.imageUrl ?? "";
      const imageChanged = nextImage !== imageUrl;

      const body: {
        dateOfBirth?: string;
        gender?: "MALE" | "FEMALE" | "OTHER";
      } = {};
      if (values.dateOfBirth) body.dateOfBirth = values.dateOfBirth;
      if (values.gender && isCustomerGender(values.gender)) {
        body.gender = values.gender;
      }

      if (!body.dateOfBirth && !body.gender && !imageChanged) {
        throw new Error("Choose a date of birth, gender, or photo to update");
      }

      if (body.dateOfBirth || body.gender) {
        await saveCustomerProfile(body);
      }

      if (imageChanged) {
        const result = await authClient.updateUser({
          image: nextImage || null,
        });
        if (result.error) {
          throw new Error(result.error.message ?? "Could not update photo");
        }
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["customer-account"] });
      toast.success("Profile saved");
      onSuccess();
    },
    onError: (err) => {
      toast.error(toProfileError(err));
    },
  });
}
