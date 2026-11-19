"use client";

import { cn } from "@/lib/utils";
import { profileImageUrl } from "@/lib/profile-image";
import { UserRound } from "lucide-react";
import Image from "next/image";
import { useMemo, useState } from "react";

type UserAvatarProps = {
  src?: string | null;
  name?: string | null;
  className?: string;
  iconSize?: number;
  showInitials?: boolean;
  sizes?: string;
};

function getInitials(name?: string | null): string {
  if (!name) return "";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function UserAvatar({
  src,
  name,
  className,
  iconSize = 22,
  showInitials = false,
  sizes = "40px",
}: UserAvatarProps) {
  const [imageError, setImageError] = useState(false);

  const initials = useMemo(() => {
    return showInitials ? getInitials(name) : "";
  }, [showInitials, name]);

  const hasValidImage = Boolean(src) && !imageError;

  return (
    <div
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-100 select-none aspect-square h-9 w-9",
        className
      )}
    >
      {hasValidImage ? (
        <Image
          src={profileImageUrl(src as string, 256)}
          alt={name || "User avatar"}
          width={80}
          height={80}
          loading="eager"
          sizes={sizes}
          onError={() => setImageError(true)}
          className="h-full w-full object-cover"
        />
      ) : initials ? (
        <span className="font-semibold text-slate-600 text-xs tracking-wider">{initials}</span>
      ) : (
        <UserRound size={iconSize} className="text-slate-500" />
      )}
    </div>
  );
}
