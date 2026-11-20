import { PageHeader } from "@/features/dashboard/admin/shared/components/page-header";
import { OverviewRangeFilter } from "./overview-range-filter";

export function OverviewHeader({ loading = false }: { loading?: boolean }) {
  return (
    <PageHeader
      title="Overview"
      description="Sales and growth for the selected period, with current operational queues."
      actions={<OverviewRangeFilter disabled={loading} />}
    />
  );
}
