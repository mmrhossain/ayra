import { MapPin, Pencil, Plus, Trash2 } from "lucide-react";

import type { AddressListProps } from "@/features/dashboard/customer/address/types";

export function AddressList({
  addresses,
  loading,
  userName,
  onAdd,
  onEdit,
  onDelete,
}: AddressListProps) {
  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            My Addresses
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Manage delivery locations for your Raangalay orders
          </p>
        </div>
        <button
          onClick={onAdd}
          className="inline-flex items-center justify-center gap-2 bg-slate-900 px-6 py-3 text-xs font-black uppercase tracking-[0.2em] text-white hover:bg-primary rounded-2xl"
        >
          <Plus size={16} />
          Add address
        </button>
      </div>

      {loading ? (
        <div className="h-40 bg-slate-100 rounded-3xl animate-pulse" />
      ) : addresses.length === 0 ? (
        <div className="py-16 text-center border-2 border-dashed border-slate-200 rounded-3xl px-6">
          <MapPin className="mx-auto text-slate-300 mb-4" size={48} />
          <h3 className="text-lg font-bold text-slate-900">
            No saved addresses
          </h3>
          <p className="text-sm text-slate-500 mt-2">
            Add one to speed up checkout.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {addresses.map((address) => (
            <div
              key={address.id}
              className="rounded-2xl border border-slate-100 p-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4"
            >
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <p className="font-bold text-slate-900">{userName}</p>
                  {address.label ? (
                    <span className="text-[10px] uppercase tracking-widest bg-slate-100 px-2 py-1 rounded-full">
                      {address.label}
                    </span>
                  ) : null}
                  {address.isDefaultShipping ? (
                    <span className="text-[10px] uppercase tracking-widest bg-primary/10 text-primary px-2 py-1 rounded-full">
                      Default shipping
                    </span>
                  ) : null}
                  {address.isDefaultBilling ? (
                    <span className="text-[10px] uppercase tracking-widest bg-slate-900 text-white px-2 py-1 rounded-full">
                      Default billing
                    </span>
                  ) : null}
                </div>
                <p className="text-sm text-slate-600">{address.phone}</p>
                <p className="text-sm text-slate-500 mt-1">
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
              <div className="flex gap-2">
                <button
                  onClick={() => onEdit(address)}
                  className="inline-flex items-center gap-1 px-3 py-2 text-xs font-bold uppercase tracking-widest border rounded-xl hover:bg-slate-50"
                >
                  <Pencil size={14} />
                  Edit
                </button>
                <button
                  onClick={() => onDelete(address)}
                  className="inline-flex items-center gap-1 px-3 py-2 text-xs font-bold uppercase tracking-widest border border-red-100 text-red-600 rounded-xl hover:bg-red-50"
                >
                  <Trash2 size={14} />
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
