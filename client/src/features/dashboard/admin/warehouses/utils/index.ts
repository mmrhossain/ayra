import { DashboardApiError } from "@/lib/api/dashboard";

import type { WarehouseFormValues } from "@/features/dashboard/admin/warehouses/schemas";
import type { WarehouseListItem } from "@/features/dashboard/admin/warehouses/types";

export function warehouseLabel(item: WarehouseListItem): string {
  return `${item.name} (${item.code})`;
}

export function toWarehouseErrorMessage(err: unknown): string {
  if (err instanceof DashboardApiError) return err.message;
  if (err instanceof Error) return err.message;
  return "Something went wrong";
}

export function emptyValues(): WarehouseFormValues {
  return {
    name: "",
    code: "",
    phone: undefined,
    email: undefined,
    country: "",
    state: undefined,
    city: "",
    addressLine1: "",
    addressLine2: undefined,
    isActive: true,
  };
}

export function fromWarehouse(item: WarehouseListItem): WarehouseFormValues {
  return {
    name: item.name,
    code: item.code,
    phone: item.phone ?? undefined,
    email: item.email ?? undefined,
    country: item.country,
    state: item.state ?? undefined,
    city: item.city,
    addressLine1: item.addressLine1,
    addressLine2: item.addressLine2 ?? undefined,
    isActive: item.isActive,
  };
}
