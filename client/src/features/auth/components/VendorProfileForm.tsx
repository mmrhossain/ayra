"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { errorToast, successToast } from "@/helpers";
import { bdPhoneSchema } from "@/lib/validators/bangladesh";
import {
  updateVendorProfile,
  toProfileError,
  type VendorProfile,
} from "@/features/dashboard/vendor/profile/api/profile";

type Props = {
  initialProfile: VendorProfile;
};

const VendorProfileForm = ({ initialProfile }: Props) => {
  const [shopName, setShopName] = useState(initialProfile.shopName ?? "");
  const [description, setDescription] = useState(
    initialProfile.description ?? ""
  );
  const [phone, setPhone] = useState(initialProfile.phone ?? "");
  const [logo, setLogo] = useState(initialProfile.logo ?? "");
  const [saved, setSaved] = useState<VendorProfile>(initialProfile);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (phone && !bdPhoneSchema.safeParse(phone).success) {
      errorToast("Enter a valid Bangladesh phone number");
      return;
    }

    const body: {
      shopName?: string;
      description?: string;
      phone?: string;
      logo?: string;
    } = {};
    if (shopName.trim()) body.shopName = shopName.trim();
    if (description.trim()) body.description = description.trim();
    if (phone.trim()) body.phone = phone.trim();
    if (logo.trim()) body.logo = logo.trim();

    if (Object.keys(body).length === 0) {
      errorToast("Update at least one profile field");
      return;
    }

    try {
      setSaving(true);
      const updated = await updateVendorProfile(body);
      setSaved(updated);
      setShopName(updated.shopName ?? shopName);
      setDescription(updated.description ?? description);
      setPhone(updated.phone ?? phone);
      setLogo(updated.logo ?? logo);
      successToast("Vendor profile updated");
    } catch (err) {
      errorToast(toProfileError(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Shop profile</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Shop slug is assigned at registration and cannot be changed.
        </p>
      </div>

      <div className="space-y-2">
        <Label>Shop slug</Label>
        <Input
          value={saved.shopSlug}
          readOnly
          placeholder="Assigned at registration"
          className="bg-muted cursor-default"
        />
      </div>

      <div className="space-y-2">
        <Label>Shop name</Label>
        <Input value={shopName} onChange={(e) => setShopName(e.target.value)} />
      </div>

      <div className="space-y-2">
        <Label>Phone</Label>
        <Input
          value={phone}
          inputMode="tel"
          placeholder="01XXXXXXXXX"
          onChange={(e) => setPhone(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label>Logo URL</Label>
        <Input
          value={logo}
          placeholder="https://"
          onChange={(e) => setLogo(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label>Description</Label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
        />
      </div>

      <button
        onClick={() => void handleSave()}
        disabled={saving}
        className="bg-slate-900 text-white px-5 py-2.5 rounded-xl text-sm font-bold disabled:opacity-50"
      >
        {saving ? "Saving..." : "Save profile"}
      </button>
    </div>
  );
};

export default VendorProfileForm;
