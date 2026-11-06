import { requireAdminPageAccess } from "@/lib/api/auth/server";
import { Suspense } from "react";

import {
  fetchAdminStaff,
  toStaffErrorMessage,
} from "@/features/dashboard/admin/staff/api/staff";
import { StaffTable } from "@/features/dashboard/admin/staff/components/staff-table";
import { PageError } from "@/features/dashboard/admin/shared/components/page-error";
import { PageHeader } from "@/features/dashboard/admin/shared/components/page-header";

export const dynamic = "force-dynamic";

export default async function AdminStaffPage() {
  await requireAdminPageAccess("/admin/staff");
  let initial;
  let error: string | null = null;

  try {
    initial = await fetchAdminStaff();
  } catch (err) {
    error = toStaffErrorMessage(err);
  }

  return (
    <section className="space-y-6">
      <PageHeader
        title="Staff"
        description="Admin accounts, their access areas and invitation lifecycle. Full access is an explicit super-admin flag, not an empty permission list."
      />
      {error || !initial ? (
        <PageError
          title="Could not load staff"
          message={error ?? "Unknown error"}
        />
      ) : (
        <Suspense fallback={null}>
          <StaffTable initialData={initial} />
        </Suspense>
      )}
    </section>
  );
}
