"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  createLegalDocument,
  publishLegalDocument,
  updateLegalDocument,
} from "@/features/dashboard/admin/legal/api/legal";
import type { LegalFormValues } from "@/features/dashboard/admin/legal/schemas";
import type {
  DialogMode,
  LegalDocumentItem,
} from "@/features/dashboard/admin/legal/types";
import { toLegalErrorMessage } from "@/features/dashboard/admin/legal/utils";

export function useLegalFormMutation({
  mode,
  initialData,
  onSuccess,
}: {
  mode: DialogMode;
  initialData?: LegalDocumentItem;
  onSuccess: () => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (values: LegalFormValues) => {
      const effectiveAt = values.effectiveAt?.trim()
        ? new Date(values.effectiveAt).toISOString()
        : undefined;
      if (mode === "edit") {
        if (!initialData) throw new Error("Missing document");
        return updateLegalDocument(initialData.id, {
          version: values.version.trim(),
          title: values.title.trim(),
          body: values.body.trim(),
          effectiveAt: effectiveAt ?? null,
        });
      }
      return createLegalDocument({
        type: values.type,
        version: values.version.trim(),
        title: values.title.trim(),
        body: values.body.trim(),
        ...(effectiveAt ? { effectiveAt } : {}),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-legal"] });
      toast.success(mode === "edit" ? "Document updated" : "Document created");
      onSuccess();
    },
    onError: (err) => {
      toast.error(toLegalErrorMessage(err));
    },
  });
}

export function useLegalPublishMutation({
  document,
  onSuccess,
}: {
  document: LegalDocumentItem | null;
  onSuccess: () => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!document) throw new Error("Missing document");
      await publishLegalDocument(document.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-legal"] });
      toast.success("Document published");
      onSuccess();
    },
    onError: (err) => {
      toast.error(toLegalErrorMessage(err));
    },
  });
}
