"use client";

import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import React from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import AuthCard, {
  AuthSpinner,
  authInputClass,
  authSubmitClass,
} from "@/features/auth/components/AuthCard";
import {
  acceptInvitation,
  lookupInvitation,
} from "@/features/dashboard/admin/staff/api/staff";
import { toStaffErrorMessage } from "@/features/dashboard/admin/staff/utils";
import type { InvitationLookup } from "@/features/dashboard/admin/staff/types/models";
import { errorToast } from "@/helpers";

const AcceptInvitationForm: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [invitation, setInvitation] = React.useState<InvitationLookup | null>(null);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(Boolean(token));
  const [submitting, setSubmitting] = React.useState(false);
  const [name, setName] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [signInRequired, setSignInRequired] = React.useState(false);

  React.useEffect(() => {
    if (!token) return;

    let active = true;
    lookupInvitation(token)
      .then((data) => {
        if (!active) return;
        setInvitation(data);
        setName(data.name);
        if (data.status !== "PENDING") {
          setLoadError(
            data.status === "EXPIRED"
              ? "This invitation has expired. Ask an administrator to resend it."
              : `This invitation is ${data.status.toLowerCase()}.`,
          );
        }
      })
      .catch((err: unknown) => {
        if (active) setLoadError(toStaffErrorMessage(err));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [token]);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!token) return;

    setSubmitting(true);
    try {
      await acceptInvitation({
        token,
        ...(password ? { password } : {}),
        ...(name ? { name } : {}),
      });
      router.replace("/admin");
    } catch (err) {
      const message = toStaffErrorMessage(err);
      if (/sign in with the invited email/i.test(message)) {
        setSignInRequired(true);
      }
      errorToast(message);
    } finally {
      setSubmitting(false);
    }
  };

  const backHref = token
    ? `/login?redirect=${encodeURIComponent(`/accept-invitation?token=${token}`)}`
    : "/login";

  if (loading) {
    return (
      <AuthCard title="Checking invitation" showBack={false}>
        <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
          Loading invitation...
        </div>
      </AuthCard>
    );
  }

  if (!token) {
    return (
      <AuthCard title="Invitation unavailable" showBack>
        <p className="text-sm text-muted-foreground">
          This invitation link is missing its token.
        </p>
        <Link href="/login" className="mt-4 inline-block text-sm font-semibold text-primary">
          Go to sign in
        </Link>
      </AuthCard>
    );
  }

  if (loadError || !invitation) {
    return (
      <AuthCard title="Invitation unavailable" showBack>
        <p className="text-sm text-muted-foreground">
          {loadError ?? "This invitation could not be found."}
        </p>
        <Link href="/login" className="mt-4 inline-block text-sm font-semibold text-primary">
          Go to sign in
        </Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Accept your invitation"
      description={`You were invited as ${invitation.email}. Set a password to activate the account.`}
      showBack
      backHref="/"
    >
      {signInRequired ? (
        <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          An account already exists for this email. Sign in first, then reopen this
          link.
          <Link href={backHref} className="ml-1 font-semibold underline">
            Sign in
          </Link>
        </div>
      ) : null}

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="accept-name">Full name</Label>
          <Input
            id="accept-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className={authInputClass}
            autoComplete="name"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="accept-password">Password</Label>
          <div className="relative">
            <Input
              id="accept-password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className={authInputClass}
              autoComplete="new-password"
              minLength={8}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((current) => !current)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            At least 8 characters. If you already have an account with this email,
            sign in instead.
          </p>
        </div>

        <button type="submit" className={authSubmitClass} disabled={submitting}>
          {submitting ? <AuthSpinner /> : "Activate account"}
        </button>
      </form>
    </AuthCard>
  );
};

export default AcceptInvitationForm;
