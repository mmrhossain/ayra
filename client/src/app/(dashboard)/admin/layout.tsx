import { DashboardShell } from "@/features/dashboard/admin/shared/components/dashboard-shell";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export default async function AdminAreaLayout({ children }: { children: React.ReactNode }) {
  // ১. সার্ভার থেকে কুকি রিড করা হলো (Shadcn Sidebar সাধারণত "sidebar:state" কুকি ব্যবহার করে)
  const cookieStore = await cookies();
  const cookieState = cookieStore.get("sidebar:state")?.value;
  const defaultOpen = cookieState ? cookieState === "true" : true;

  return <DashboardShell defaultOpen={defaultOpen}>{children}</DashboardShell>;
}
