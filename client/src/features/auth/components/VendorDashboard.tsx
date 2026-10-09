import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { VendorProfile } from "@/features/dashboard/vendor/profile/api/profile";
import Image from "next/image";

type Props = {
  profile: VendorProfile;
  accountName?: string;
  accountEmail?: string;
};

export function VendorDashboard({ profile, accountName, accountEmail }: Props) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          {profile.logo ? (
            <Image
              src={profile.logo}
              alt={profile.shopName || "Shop logo"}
              className="size-16 rounded-xl border object-contain"
            />
          ) : (
            <div className="flex size-16 items-center justify-center rounded-xl border bg-muted text-lg font-semibold">
              {(profile.shopName || "V").slice(0, 1).toUpperCase()}
            </div>
          )}
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {profile.shopName || "Vendor Dashboard"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {profile.shopSlug}
              {accountEmail ? ` · ${accountEmail}` : ""}
            </p>
          </div>
        </div>
        <Button asChild>
          <Link href="/vendor/profile">Edit shop profile</Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Approval</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tracking-tight">
              {profile.isApproved ? "Approved" : "Pending"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Phone</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tracking-tight">{profile.phone || "—"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Shop owner</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tracking-tight">{accountName || "—"}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>About the shop</CardTitle>
          <CardDescription>Shown to customers once vendor catalog pages are live.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
            {profile.description?.trim() || "No shop description yet."}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
