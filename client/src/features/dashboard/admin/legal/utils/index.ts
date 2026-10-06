import { DashboardApiError } from "@/lib/api/dashboard";

import type { LegalFormValues } from "@/features/dashboard/admin/legal/schemas";
import type {
  LegalDocumentItem,
  LegalType,
} from "@/features/dashboard/admin/legal/types";

export function legalTypeLabel(type: LegalType): string {
  return type === "PRIVACY" ? "Privacy Policy" : "Terms of Service";
}

export function toLegalErrorMessage(err: unknown): string {
  if (err instanceof DashboardApiError) return err.message;
  if (err instanceof Error) return err.message;
  return "Something went wrong";
}

export function legalFormDefaults(
  initialData?: LegalDocumentItem,
): LegalFormValues {
  if (!initialData) {
    return {
      type: "PRIVACY",
      version: "",
      title: "",
      body: "",
      effectiveAt: "",
    };
  }
  return {
    type: initialData.type,
    version: initialData.version,
    title: initialData.title,
    body: initialData.body,
    effectiveAt: initialData.effectiveAt
      ? initialData.effectiveAt.slice(0, 10)
      : "",
  };
}
