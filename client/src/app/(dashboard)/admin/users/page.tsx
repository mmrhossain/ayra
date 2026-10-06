import { UserTable } from "@/features/dashboard/admin/customers/components/customer-table";
import {
  fetchAdminUserList,
  parseUserRole,
  parseUserStatus,
  toUserErrorMessage,
} from "@/features/dashboard/admin/customers/api/customer";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ role?: string; status?: string }>;
};

export default async function AdminUsersPage({ searchParams }: Props) {
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
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
        <p className="text-sm text-muted-foreground">
          Approve, revoke, or suspend accounts.
        </p>
      </div>
      {error || !initial ? (
        <div
          role="alert"
          className="rounded-xl border border-destructive/30 bg-destructive/5 p-6"
        >
          <h2 className="text-lg font-semibold">Could not load users</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {error ?? "Unknown error"}
          </p>
        </div>
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
