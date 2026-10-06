import { DashboardApiError } from "@/lib/api/dashboard";

export const HEX_COLOR = /^#[0-9A-Fa-f]{6}$/;
export const DEFAULT_HEX = "#000000";

export function isColorAttribute(name?: string | null): boolean {
  if (!name) return false;
  const n = name.toLowerCase();
  return n.includes("color") || n.includes("colour");
}

export function normalizeHex(value?: string | null): string {
  const raw = value?.trim() ?? "";
  if (HEX_COLOR.test(raw)) return raw.toUpperCase();
  return DEFAULT_HEX;
}

export function toAttributeErrorMessage(err: unknown): string {
  if (err instanceof DashboardApiError) return err.message;
  if (err instanceof Error) return err.message;
  return "Something went wrong";
}

export function toAttributeDeleteErrorMessage(err: unknown): string {
  if (err instanceof DashboardApiError && err.status === 409) {
    return "This attribute is in use by product variants. Remove those first.";
  }
  return toAttributeErrorMessage(err);
}

export function toAttributeValueDeleteErrorMessage(err: unknown): string {
  if (err instanceof DashboardApiError && err.status === 409) {
    return "This value is in use by product variants. Remove those first.";
  }
  return toAttributeErrorMessage(err);
}
