import * as React from "react";

import { Table } from "@/components/ui/table";
import { cn } from "@/lib/utils";

export function ResponsiveTable({
  className,
  ...props
}: React.ComponentProps<typeof Table>) {
  return <Table className={cn("responsive-table", className)} {...props} />;
}
