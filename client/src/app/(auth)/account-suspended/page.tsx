"use client";

import { authClient } from "@/lib/api/auth/auth-client";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AccountSuspendedPage() {
  const router = useRouter();

  const handleSignOut = async () => {
    await authClient.signOut();
    router.replace("/login");
    router.refresh();
  };

  return (
    <div className="container min-h-[70vh] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-xl shadow-gray-100/50">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Account suspended
        </h1>
        <p className="mt-3 text-sm text-slate-600">
          This account has been suspended and cannot access the store. Contact
          support if you believe this is a mistake.
        </p>
        <div className="mt-8 flex flex-col gap-3">
          <button
            type="button"
            onClick={handleSignOut}
            className="w-full rounded-xl bg-primary py-3 text-sm font-bold text-white hover:bg-primary/90"
          >
            Sign out
          </button>
          <Link
            href="/"
            className="text-sm font-semibold text-primary hover:underline"
          >
            Back to store
          </Link>
        </div>
      </div>
    </div>
  );
}
