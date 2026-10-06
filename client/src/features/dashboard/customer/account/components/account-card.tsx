"use client";

import { Calendar, Mail, Pencil, ShieldCheck, User } from "lucide-react";
import { useState } from "react";

import { UserAvatar } from "@/components/shared/user-avatar";
import { AccountEditDialog } from "@/features/dashboard/customer/account/components/account-edit-dialog";
import { useAccount } from "@/features/dashboard/customer/account/hooks/use-account";
import type { AccountCardProps } from "@/features/dashboard/customer/account/types";
import { formatDate, formatGender } from "@/features/dashboard/customer/account/utils";

export function AccountCard({ initialData }: AccountCardProps) {
  const { profile } = useAccount({ initialData });
  const [editOpen, setEditOpen] = useState(false);

  const user = profile.user;
  const name = user?.name ?? "";
  const email = user?.email ?? "";
  const displayImage = user?.image ?? "";
  const verified = Boolean(user?.emailVerified);

  return (
    <div className="space-y-8">
      {profile.customerCode ? (
        <p className="text-xs text-slate-500">Customer code: {profile.customerCode}</p>
      ) : null}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6 pb-6 md:pb-8 border-b border-slate-100">
        <div className="flex items-center gap-4 sm:gap-5">
          <UserAvatar
            src={displayImage}
            name={name}
            className="w-16 h-16 sm:w-20 sm:h-20 border-2 border-white shadow-md"
            iconSize={32}
          />
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">{name}</h1>
            <p className="text-sm text-slate-500 flex items-center gap-2 mt-1">
              <Calendar size={14} />
              Member since {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider ${
              verified ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"
            }`}
          >
            <ShieldCheck size={14} />
            {verified ? "Verified Account" : "Email not verified"}
          </div>
          <button
            type="button"
            onClick={() => setEditOpen(true)}
            className="inline-flex items-center justify-center gap-2 bg-slate-900 px-6 py-3 text-xs font-black uppercase tracking-[0.2em] text-white hover:bg-primary rounded-2xl"
          >
            <Pencil size={14} />
            Edit
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-8">
        <div className="space-y-2">
          <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">
            Full Name
          </label>
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              value={name}
              readOnly
              className="w-full pl-12 pr-4 h-11 sm:h-[52px] bg-slate-100 border border-slate-200 rounded-xl text-slate-700 cursor-default font-medium outline-none"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">
            Email Address
          </label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="email"
              value={email}
              readOnly
              className="w-full pl-12 pr-4 h-11 sm:h-[52px] bg-slate-100 border border-slate-200 rounded-xl text-slate-500 cursor-default font-medium outline-none"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">
            Date of birth
          </label>
          <div className="h-11 sm:h-[52px] px-4 flex items-center bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium">
            {formatDate(profile.dateOfBirth)}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">
            Gender
          </label>
          <div className="h-11 sm:h-[52px] px-4 flex items-center bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium">
            {formatGender(profile.gender)}
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
