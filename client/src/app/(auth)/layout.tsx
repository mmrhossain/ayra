import type { ReactNode } from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AuthLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-dvh w-full min-w-0 overflow-x-hidden bg-muted">
      {children}
    </div>
  );
}
