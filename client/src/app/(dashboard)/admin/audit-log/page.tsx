import { requireAdminPageAccess } from "@/lib/api/auth/server";
import { Suspense } from "react";

import {
  fetchAuditLogList,
  toAuditLogErrorMessage,
} from "@/features/dashboard/admin/audit-log/api/audit-log";
import { AuditLogTable } from "@/features/dashboard/admin/audit-log/components/audit-log-table";
import { PageError } from "@/features/dashboard/admin/shared/components/page-error";
import { PageHeader } from "@/features/dashboard/admin/shared/components/page-header";

export const dynamic = "force-dynamic";

export default async function AdminAuditLogPage() {
  await requireAdminPageAccess("/admin/audit-log");
  let initial;
  let error: string | null = null;

  try {
    initial = await fetchAuditLogList({ page: 1, limit: 20 });
  } catch (err) {
    error = toAuditLogErrorMessage(err);
  }

  return (
    <section className="space-y-6">
      <PageHeader
        title="Audit log"
        description="Write actions performed by staff in the admin dashboard."
      />
      {error || !initial ? (
        <PageError
          title="Could not load the audit log"
          message={error ?? "Unknown error"}
        />
      ) : (
        <Suspense fallback={null}>
          <AuditLogTable initialData={initial} />
        </Suspense>
      )}
    </section>
  );
}
