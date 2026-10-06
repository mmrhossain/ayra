"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { AdminUserItem } from "@/features/dashboard/admin/customers/api/customer";

export function VendorDetailDialog({
  open,
  onOpenChange,
  vendor,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vendor: AdminUserItem | null;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Vendor details</DialogTitle>
          <DialogDescription>
            Account fields returned by GET /api/v1/admin/users.
          </DialogDescription>
        </DialogHeader>
        {vendor ? (
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            <dt className="text-muted-foreground">Owner</dt>
            <dd className="font-medium">{vendor.name}</dd>
            <dt className="text-muted-foreground">Email</dt>
            <dd>{vendor.email}</dd>
            <dt className="text-muted-foreground">Phone</dt>
            <dd>{vendor.phone || "—"}</dd>
            <dt className="text-muted-foreground">Status</dt>
            <dd>{vendor.status}</dd>
            <dt className="text-muted-foreground">Approved</dt>
            <dd>{vendor.isApproved ? "Approved" : "Pending"}</dd>
            <dt className="text-muted-foreground">Joined</dt>
            <dd>{new Date(vendor.createdAt).toLocaleString()}</dd>
            <dt className="text-muted-foreground">Shop slug</dt>
            <dd>{vendor.vendorProfile?.shopSlug || "—"}</dd>
            <dt className="text-muted-foreground">Shop name</dt>
            <dd>{vendor.vendorProfile?.shopName || "—"}</dd>
          </dl>
        ) : null}
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
