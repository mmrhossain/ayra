"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  createSlider,
  deleteSlider,
  updateSlider,
} from "@/features/dashboard/admin/sliders/api/slider";
import type { SliderFormValues } from "@/features/dashboard/admin/sliders/schemas";
import type { DialogMode, SliderListItem } from "@/features/dashboard/admin/sliders/types";
import { toIso, toSliderErrorMessage } from "@/features/dashboard/admin/sliders/utils";

export function useSliderFormMutation({
  mode,
  initialData,
  onSuccess,
}: {
  mode: DialogMode;
  initialData?: SliderListItem;
  onSuccess: () => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (values: SliderFormValues) => {
      const body = {
        title: values.title.trim(),
        imageUrl: values.imageUrl,
        imagePublicId: values.imagePublicId || undefined,
        mobileImageUrl: values.mobileImageUrl || undefined,
        mobileImagePublicId: values.mobileImagePublicId || undefined,
        redirectUrl: values.redirectUrl?.trim() || undefined,
        startDate: toIso(values.startDate),
        endDate: toIso(values.endDate),
        priority: Number(values.priority),
        isActive: values.isActive,
      };
      if (mode === "create") {
        await createSlider(body);
        return;
      }
      if (!initialData?.id) throw new Error("Missing slider id");
      await updateSlider(initialData.id, body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-sliders"] });
      toast.success(mode === "create" ? "Slider created" : "Slider updated");
      onSuccess();
    },
    onError: (err) => {
      toast.error(toSliderErrorMessage(err));
    },
  });
}

export function useSliderDeleteMutation({
  slider,
  onSuccess,
}: {
  slider: SliderListItem | null;
  onSuccess: () => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!slider) throw new Error("Missing slider");
      await deleteSlider(slider.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-sliders"] });
      toast.success("Slider deleted");
      onSuccess();
    },
    onError: (err) => {
      toast.error(toSliderErrorMessage(err));
    },
  });
}
