import type { ReactNode } from "react";

export default function AuthLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-dvh w-full min-w-0 overflow-x-hidden bg-[#F8FAFC]">
      {children}
    </div>
  );
}
