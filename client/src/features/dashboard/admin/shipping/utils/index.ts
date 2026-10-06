import { DashboardApiError } from "@/lib/api/dashboard";
import type {
  ShippingMethodFormValues,
  ShippingRateFormValues,
  ShippingZoneFormValues,
} from "@/features/dashboard/admin/shipping/schemas";
import type {
  ShippingMethod,
  ShippingRate,
  ShippingZone,
} from "@/features/dashboard/admin/shipping/types";

export function emptyZoneValues(): ShippingZoneFormValues {
  return {
    name: "",
    code: "",
    isActive: true,
    isFallback: false,
    matchDistricts: "",
  };
}

export function fromZone(item: ShippingZone): ShippingZoneFormValues {
  return {
    name: item.name,
    code: item.code,
    isActive: item.isActive,
    isFallback: item.isFallback,
    matchDistricts: item.matchDistricts.join(", "),
  };
}

export function emptyMethodValues(): ShippingMethodFormValues {
  return { name: "", code: "", isActive: true };
}

export function fromMethod(item: ShippingMethod): ShippingMethodFormValues {
  return {
    name: item.name,
    code: item.code,
    isActive: item.isActive,
  };
}

export function emptyRateValues(): ShippingRateFormValues {
  return {
    shippingZoneId: "",
    shippingMethodId: "",
    price: 0,
    freeShippingFrom: null,
    isActive: true,
  };
}

export function fromRate(item: ShippingRate): ShippingRateFormValues {
  return {
    shippingZoneId: item.shippingZoneId,
    shippingMethodId: item.shippingMethodId,
    price: Number(item.price),
    freeShippingFrom:
      item.freeShippingFrom == null ? null : Number(item.freeShippingFrom),
    isActive: item.isActive,
  };
}

export function toShippingErrorMessage(err: unknown): string {
  if (err instanceof DashboardApiError) return err.message;
  if (err instanceof Error) return err.message;
  return "Something went wrong";
}
