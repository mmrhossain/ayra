"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  bookShipmentCourier,
  createShipment,
  updateShipmentStatus,
} from "@/features/dashboard/admin/shipments/api/shipments";
import { toShipmentErrorMessage } from "@/features/dashboard/admin/shipments/utils";
import type {
  CreateShipmentBody,
  UpdateShipmentStatusBody,
} from "@/features/dashboard/admin/shipments/types/models";

function invalidateShipmentQueries(
  queryClient: ReturnType<typeof useQueryClient>,
) {
  queryClient.invalidateQueries({ queryKey: ["admin-shipments"] });
  queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
}

export function useCreateShipmentMutation(onSuccess: () => void) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: CreateShipmentBody) => createShipment(body),
    onSuccess: () => {
      invalidateShipmentQueries(queryClient);
      toast.success("Shipment created");
      onSuccess();
    },
    onError: (err) => {
      toast.error(toShipmentErrorMessage(err));
    },
  });
}

export function useUpdateShipmentStatusMutation(onSuccess: () => void) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string;
      body: UpdateShipmentStatusBody;
    }) => updateShipmentStatus(id, body),
    onSuccess: () => {
      invalidateShipmentQueries(queryClient);
      toast.success("Shipment status updated");
      onSuccess();
    },
    onError: (err) => {
      toast.error(toShipmentErrorMessage(err));
    },
  });
}

export function useBookCourierMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => bookShipmentCourier(id),
    onSuccess: (shipment) => {
      invalidateShipmentQueries(queryClient);
      toast.success(
        `Courier booked${shipment.trackingNumber ? ` · ${shipment.trackingNumber}` : ""}`,
      );
    },
    onError: (err) => {
      toast.error(toShipmentErrorMessage(err));
    },
  });
}
