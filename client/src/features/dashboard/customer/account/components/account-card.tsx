"use client";

import { Calendar, Mail, Pencil, ShieldCheck, User } from "lucide-react";
import { useState } from "react";

import { UserAvatar } from "@/components/shared/user-avatar";
import { Switch } from "@/components/ui/switch";
import { AccountEditDialog } from "@/features/dashboard/customer/account/components/account-edit-dialog";
import {
  useAccount,
  useNotificationPreferences,
} from "@/features/dashboard/customer/account/hooks/use-account";
import type { AccountCardProps } from "@/features/dashboard/customer/account/types";
import { formatDate, formatGender } from "@/features/dashboard/customer/account/utils";

export function AccountCard({
  initialData,
  initialPreferences,
}: AccountCardProps) {
  const { profile } = useAccount({ initialData });
  const { preferences, mutation } = useNotificationPreferences({
    initialData: initialPreferences,
  });
  const [editOpen, setEditOpen] = useState(false);

  const user = profile.user;
  const name = user?.name ?? "";
  const email = user?.email ?? "";
  const displayImage = user?.image ?? "";
  const verified = Boolean(user?.emailVerified);

  return (
    <div className="space-y-8">
      {profile.customerCode ? (
        <p className="text-xs text-muted-foreground">Customer code: {profile.customerCode}</p>
      ) : null}
      <div className="flex flex-col justify-between gap-4 border-b border-border pb-6 sm:gap-6 md:flex-row md:items-center md:pb-8">
        <div className="flex min-w-0 items-center gap-4 sm:gap-5">
          <UserAvatar
            src={displayImage}
            name={name}
            className="h-16 w-16 border-2 border-white shadow-md sm:h-20 sm:w-20"
            iconSize={32}
          />
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-semibold leading-tight tracking-tight text-foreground">
              {name}
            </h1>
            <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <Calendar size={14} aria-hidden />
              Member since{" "}
              {user?.createdAt
                ? new Date(user.createdAt).toLocaleDateString()
                : "N/A"}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wider ${
              verified
                ? "bg-green-50 text-green-700"
                : "bg-amber-50 text-amber-700"
            }`}
          >
            <ShieldCheck size={14} aria-hidden />
            {verified ? "Verified Account" : "Email not verified"}
          </div>
          <button
            type="button"
            onClick={() => setEditOpen(true)}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-xs font-semibold uppercase tracking-wide text-white transition-colors hover:bg-primary/90"
          >
            <Pencil size={14} aria-hidden />
            Edit
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-8">
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground ml-1">
            Full Name
          </label>
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <input
              type="text"
              value={name}
              readOnly
              className="h-11 w-full cursor-default rounded-xl border border-border bg-muted pl-12 pr-4 font-medium text-foreground outline-none sm:h-12"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground ml-1">
            Email Address
          </label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <input
              type="email"
              value={email}
              readOnly
              className="h-11 w-full cursor-default rounded-xl border border-border bg-muted pl-12 pr-4 font-medium text-muted-foreground outline-none sm:h-12"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground ml-1">
            Date of birth
          </label>
          <div className="flex h-11 items-center rounded-xl border border-border bg-muted px-4 font-medium text-foreground sm:h-12">
            {formatDate(profile.dateOfBirth)}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground ml-1">
            Gender
          </label>
          <div className="flex h-11 items-center rounded-xl border border-border bg-muted px-4 font-medium text-foreground sm:h-12">
            {formatGender(profile.gender)}
          </div>
        </div>
      </div>

      <div className="space-y-4 rounded-xl border border-border p-5">
        <div>
          <h2 className="text-sm font-bold text-foreground">Notifications</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Choose which updates you receive. Order and shipment emails are
            sent only when email updates are enabled.
          </p>
        </div>
        <div className="divide-y divide-border">
          <div className="flex items-center justify-between gap-4 py-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">
                Email updates
              </p>
              <p className="text-xs text-muted-foreground">
                Order confirmations, payment receipts, and shipment tracking.
              </p>
            </div>
            <Switch
              checked={preferences.emailEnabled}
              disabled={mutation.isPending}
              onCheckedChange={(checked) =>
                mutation.mutate({ emailEnabled: checked })
              }
              aria-label="Email updates"
            />
          </div>
          <div className="flex items-center justify-between gap-4 py-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">
                Push notifications
              </p>
              <p className="text-xs text-muted-foreground">
                Alerts in supported browsers and devices.
              </p>
            </div>
            <Switch
              checked={preferences.pushEnabled}
              disabled={mutation.isPending}
              onCheckedChange={(checked) =>
                mutation.mutate({ pushEnabled: checked })
              }
              aria-label="Push notifications"
            />
          </div>
          <div className="flex items-center justify-between gap-4 py-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">
                SMS updates
              </p>
              <p className="text-xs text-muted-foreground">
                Text messages for important delivery updates.
              </p>
            </div>
            <Switch
              checked={preferences.smsEnabled}
              disabled={mutation.isPending}
              onCheckedChange={(checked) =>
                mutation.mutate({ smsEnabled: checked })
              }
              aria-label="SMS updates"
            />
          </div>
        </div>
      </div>

      <AccountEditDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        profile={profile}
        imageUrl={displayImage}
      />
    </div>
  );
}
