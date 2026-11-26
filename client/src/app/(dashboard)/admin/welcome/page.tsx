import { Sparkles } from "lucide-react";
import { redirect } from "next/navigation";

import { requireRole } from "@/lib/api/auth/server";

export const dynamic = "force-dynamic";

export default async function AdminWelcomePage() {
  const session = await requireRole("ADMIN");
  const user = session.user;
  if (!user) redirect("/login");

  const displayName =
    user.name?.trim() || user.email?.split("@")[0] || "there";

  return (
    <section className="min-w-0">
      <div className="relative overflow-hidden rounded-2xl border border-border-color bg-background p-6 shadow-sm sm:p-9 lg:p-12">
        <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-20 size-64 rounded-full border border-border-color/70 sm:size-80" />
        <div aria-hidden="true" className="pointer-events-none absolute -right-2 -top-10 size-44 rounded-full border border-border-color/70 sm:size-60" />
        <div className="relative max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-primary">
            <Sparkles aria-hidden="true" className="size-3.5" />
            Staff workspace
          </span>
          <h1 className="mt-5 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Welcome, {displayName}
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
            Your staff workspace is ready. Use the sidebar to open the dashboard sections available to you.
          </p>
        </div>
      </div>
    </section>
  );
}
