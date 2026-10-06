"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  createAddress,
  deleteAddress,
  updateAddress,
} from "@/features/dashboard/customer/address/api/addresses";
import type { AddressFormValues } from "@/features/dashboard/customer/address/schemas";
import type { AddressPayload, SavedAddress } from "@/features/dashboard/customer/address/types";
import { toAddressError } from "@/features/dashboard/customer/address/utils";

function toPayload(
  values: AddressFormValues,
  fullName: string,
): AddressPayload {
  const payload: AddressPayload = {
    fullName,
    phone: values.phone,
    country: values.country || "Bangladesh",
    division: values.division,
    district: values.district,
    addressLine1: values.addressLine1,
    isDefaultShipping: values.isDefaultShipping,
    isDefaultBilling: values.isDefaultBilling,
  };
  if (values.label) payload.label = values.label;
  if (values.email) payload.email = values.email;
  if (values.thana) payload.thana = values.thana;
  if (values.postalCode) payload.postalCode = values.postalCode;
  return payload;
}

export function useAddressFormMutation({
  editingId,
  fullName,
  onSuccess,
}: {
  editingId: string | null;
  fullName: string;
  onSuccess: () => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (values: AddressFormValues) => {
      const payload = toPayload(values, fullName);
      if (editingId) {
        await updateAddress(editingId, payload);
        return;
      }
      await createAddress(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer-addresses"] });
      toast.success(editingId ? "Address updated" : "Address saved");
      onSuccess();
    },
    onError: (err) => {
      toast.error(toAddressError(err));
    },
  });
}

export function useAddressDeleteMutation({
  address,
  onSuccess,
}: {
  address: SavedAddress | null;
  onSuccess: () => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!address) throw new Error("Missing address");
      await deleteAddress(address.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer-addresses"] });
      toast.success("Address deleted");
      onSuccess();
    },
    onError: (err) => {
      toast.error(toAddressError(err));
    },
  });
}
