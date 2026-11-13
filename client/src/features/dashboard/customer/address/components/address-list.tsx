"use client";

import { MapPin, Pencil, Plus, Trash2 } from "lucide-react";

import type { AddressListProps } from "@/features/dashboard/customer/address/types";
import { usePublicSettings } from "@/features/settings/public-settings-provider";

export function AddressList({
  addresses,
  loading,
  userName,
  onAdd,
  onEdit,
  onDelete,
}: AddressListProps) {
  const { store } = usePublicSettings();
  return (
    <>
      <div className="flex flex-col justify-between gap-4 border-b border-border pb-6 sm:flex-row sm:items-center">
        <div className="min-w-0">
          <h2 className="text-2xl font-semibold leading-tight tracking-tight text-foreground">
            My Addresses
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage delivery locations for your {store.name} orders
          </p>
        </div>
        <button
          onClick={onAdd}
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-xs font-semibold uppercase tracking-wide text-white transition-colors hover:bg-primary/90 sm:w-auto"
        >
          <Plus size={16} />
          Add address
        </button>
      </div>

      {loading ? (
        <div className="space-y-4 pt-6">
          {Array.from({ length: 2 }).map((_, i) => (
            <div
              key={i}
              className="animate-pulse rounded-xl border border-border p-5"
            >
              <div className="mb-3 h-5 w-40 rounded bg-muted" />
              <div className="h-4 w-32 rounded bg-muted" />
              <div className="mt-2 h-4 w-3/4 rounded bg-muted" />
            </div>
          ))}
        </div>
      ) : addresses.length === 0 ? (
        <div className="mt-6 rounded-xl border-2 border-dashed border-border px-6 py-16 text-center">
          <MapPin className="mx-auto mb-4 text-muted-foreground/60" size={48} aria-hidden />
          <h3 className="text-lg font-bold text-foreground">
            No saved addresses
          </h3>
          <p className="text-sm text-muted-foreground mt-2">
            Add one to speed up checkout.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 pt-6">
          {addresses.map((address) => (
            <div
              key={address.id}
              className="flex flex-col justify-between gap-4 rounded-xl border border-border p-4 sm:flex-row sm:items-start sm:p-5"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <p className="font-bold text-foreground">{userName}</p>
                  {address.label ? (
                    <span className="text-xs uppercase tracking-wide bg-muted px-2 py-1 rounded-full">
                      {address.label}
                    </span>
                  ) : null}
                  {address.isDefaultShipping ? (
                    <span className="text-xs uppercase tracking-wide bg-primary/10 text-primary px-2 py-1 rounded-full">
                      Default shipping
                    </span>
                  ) : null}
                  {address.isDefaultBilling ? (
                    <span className="text-xs uppercase tracking-wide bg-primary text-white px-2 py-1 rounded-full">
                      Default billing
                    </span>
                  ) : null}
                </div>
                <p className="text-sm text-muted-foreground">{address.phone}</p>
                <p className="mt-1 break-words text-sm text-muted-foreground">
                  {[
                    address.addressLine1,
                    address.thana,
                    address.district,
                    address.division,
                    address.postalCode,
                    address.country,
                  ]
                    .filter(Boolean)
                    .join(", ")}
                </p>
              </div>
              <div className="flex gap-2 max-sm:w-full">
                <button
                  onClick={() => onEdit(address)}
                  className="inline-flex min-h-11 items-center justify-center gap-1 rounded-xl border px-3 py-2 text-xs font-bold uppercase tracking-wide transition-colors hover:bg-muted max-sm:flex-1"
                >
                  <Pencil size={14} aria-hidden />
                  Edit
                </button>
                <button
                  onClick={() => onDelete(address)}
                  className="inline-flex min-h-11 items-center justify-center gap-1 rounded-xl border border-red-100 px-3 py-2 text-xs font-bold uppercase tracking-wide text-red-600 transition-colors hover:bg-red-50 max-sm:flex-1"
                >
                  <Trash2 size={14} aria-hidden />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
