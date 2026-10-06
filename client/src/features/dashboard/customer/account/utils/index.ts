import { DashboardApiError } from "@/lib/api/dashboard";
import type { CustomerGender, CustomerProfile } from "@/features/dashboard/customer/account/types";
import type { AccountFormValues } from "@/features/dashboard/customer/account/schemas";

export function toProfileError(err: unknown): string {
  if (err instanceof DashboardApiError) return err.message;
  if (err instanceof Error) return err.message;
  return "Something went wrong";
}

export function toDateInput(value?: string | Date | null): string {
  if (!value) return "";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

export function formatDate(value?: string | Date | null): string {
  const input = toDateInput(value);
  if (!input) return "Not set";
  const d = new Date(`${input}T00:00:00`);
  if (Number.isNaN(d.getTime())) return "Not set";
  return d.toLocaleDateString();
}

export function formatGender(value?: string | null): string {
  if (value === "MALE") return "Male";
  if (value === "FEMALE") return "Female";
  if (value === "OTHER") return "Other";
  return "Not set";
}

export function accountFormDefaults(
  profile: CustomerProfile,
  imageUrl: string,
): AccountFormValues {
  return {
    dateOfBirth: toDateInput(profile.dateOfBirth),
    gender: (profile.gender ?? "") as AccountFormValues["gender"],
    imageUrl,
  };
}

export function isCustomerGender(value: string): value is CustomerGender {
  return value === "MALE" || value === "FEMALE" || value === "OTHER";
}
