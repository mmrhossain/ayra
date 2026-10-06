"use client";

import { useState } from "react";

import { AddressDeleteDialog } from "@/features/dashboard/customer/address/components/address-delete-dialog";
import { AddressFormDialog } from "@/features/dashboard/customer/address/components/address-form-dialog";
import { AddressList } from "@/features/dashboard/customer/address/components/address-list";
import { useAddressList } from "@/features/dashboard/customer/address/hooks/use-address-list";
import { useAddressDeleteMutation } from "@/features/dashboard/customer/address/hooks/use-address-mutations";
import type {
  AddressPageProps,
  SavedAddress,
} from "@/features/dashboard/customer/address/types";
import { authClient } from "@/lib/api/auth/auth-client";

export function AddressPage({ initialData }: AddressPageProps) {
  const { query, addresses } = useAddressList({ initialData });
  const { data } = authClient.useSession();
  const userName = data?.user?.name;

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<SavedAddress | null>(null);
  const [deleting, setDeleting] = useState<SavedAddress | null>(null);

  const deleteMutation = useAddressDeleteMutation({
    address: deleting,
    onSuccess: () => setDeleting(null),
  });

  return (
    <div className="space-y-8">
      <AddressList
        addresses={addresses}
        loading={query.isPending && addresses.length === 0}
        userName={userName}
        onAdd={() => {
          setEditing(null);
          setFormOpen(true);
        }}
        onEdit={(address) => {
          setEditing(address);
          setFormOpen(true);
        }}
        onDelete={setDeleting}
      />
      <AddressFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditing(null);
        }}
        editing={editing}
        userName={userName}
      />
      <AddressDeleteDialog
        address={deleting}
        pending={deleteMutation.isPending}
        onCancel={() => setDeleting(null)}
        onConfirm={() => deleteMutation.mutate()}
      />
    </div>
  );
}
