"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  createAttribute,
  createAttributeValues,
  createAttributeValue,
  deleteAttribute,
  deleteAttributeValue,
  updateAttribute,
  updateAttributeValue,
} from "@/features/dashboard/admin/attributes/api/attributes";
import type {
  AttributeFormValues,
  AttributeValueFormValues,
} from "@/features/dashboard/admin/attributes/schemas";
import type {
  AttributeListItem,
  AttributeValueItem,
  DialogMode,
} from "@/features/dashboard/admin/attributes/types";
import {
  normalizeHex,
  toAttributeDeleteErrorMessage,
  toAttributeErrorMessage,
  toAttributeValueDeleteErrorMessage,
} from "@/features/dashboard/admin/attributes/utils";

export function useAttributeFormMutation({
  mode,
  initialData,
  onSuccess,
}: {
  mode: DialogMode;
  initialData?: AttributeListItem;
  onSuccess: () => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (values: AttributeFormValues) => {
      if (mode === "edit") {
        if (!initialData) throw new Error("Missing attribute");
        return updateAttribute(initialData.id, values.name.trim());
      }
      return createAttribute(values.name.trim());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-attributes"] });
      toast.success(mode === "edit" ? "Attribute updated" : "Attribute created");
      onSuccess();
    },
    onError: (err) => {
      toast.error(toAttributeErrorMessage(err));
    },
  });
}

export function useAttributeDeleteMutation({
  attribute,
  onSuccess,
}: {
  attribute: AttributeListItem | null;
  onSuccess: () => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!attribute) throw new Error("Missing attribute");
      await deleteAttribute(attribute.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-attributes"] });
      toast.success("Attribute deleted");
      onSuccess();
    },
    onError: (err) => {
      toast.error(toAttributeDeleteErrorMessage(err));
    },
  });
}

export function useAttributeValueFormMutation({
  mode,
  attribute,
  initialData,
  onSuccess,
}: {
  mode: DialogMode;
  attribute: AttributeListItem | null;
  initialData?: AttributeValueItem;
  onSuccess: () => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (values: AttributeValueFormValues) => {
      const color = values.requireColor ? normalizeHex(values.color) : undefined;
      if (mode === "edit") {
        if (!initialData) throw new Error("Missing value");
        return updateAttributeValue(initialData.id, values.value.trim(), color);
      }
      if (!attribute) throw new Error("Missing attribute");
      const tokens = [
        ...new Set(
          values.value
            .split(/[\n,]+/)
            .map((token) => token.trim())
            .filter(Boolean),
        ),
      ];
      if (!tokens.length) throw new Error("Enter at least one value");
      if (tokens.length === 1 && tokens[0]) {
        return createAttributeValue(attribute.id, tokens[0], color);
      }
      return createAttributeValues(
        attribute.id,
        tokens.map((value) => ({ value, ...(color ? { color } : {}) })),
      );
    },
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ["admin-attributes"] });
      const count = Array.isArray(created) ? created.length : 1;
      toast.success(
        mode === "edit"
          ? "Value updated"
          : count > 1
            ? `${count} values added`
            : "Value added",
      );
      onSuccess();
    },
    onError: (err) => {
      toast.error(toAttributeErrorMessage(err));
    },
  });
}

export function useAttributeValueDeleteMutation({
  value,
  onSuccess,
}: {
  value: AttributeValueItem | null;
  onSuccess: () => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!value) throw new Error("Missing value");
      await deleteAttributeValue(value.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-attributes"] });
      toast.success("Value deleted");
      onSuccess();
    },
    onError: (err) => {
      toast.error(toAttributeValueDeleteErrorMessage(err));
    },
  });
}
