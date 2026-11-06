import { requireAdminPageAccess } from "@/lib/api/auth/server";
import { UserTable } from "@/features/dashboard/admin/customers/components/customer-table";
import {
  fetchAdminUserList,
  parseUserRole,
  parseUserStatus,
  toUserErrorMessage,
} from "@/features/dashboard/admin/customers/api/customer";
import { PageError } from "@/features/dashboard/admin/shared/components/page-error";
import { PageHeader } from "@/features/dashboard/admin/shared/components/page-header";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ role?: string; status?: string }>;
};

export default async function AdminUsersPage({ searchParams }: Props) {
  await requireAdminPageAccess("/admin/users");
  const params = await searchParams;
  const role = parseUserRole(params.role);
  const status = parseUserStatus(params.status);

  let initial;
  let error: string | null = null;

  try {
    initial = await fetchAdminUserList({
      page: 1,
      limit: 20,
      role,
      status,
    });
  } catch (err) {
    error = toUserErrorMessage(err);
  }

  return (
    <section className="space-y-6">
      <PageHeader
        title="Users"
        description="Approve, revoke, or suspend accounts."
      />
      {error || !initial ? (
        <PageError
          title="Could not load users"
          message={error ?? "Unknown error"}
        />
      ) : (
        <UserTable
          initialData={initial}
          initialRole={role}
          initialStatus={status}
        />
      )}
    </section>
  );
}
