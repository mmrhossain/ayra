"use client";

import { cn } from "@/lib/utils";
import { UserRound } from "lucide-react";
import Image from "next/image";
import { useMemo, useState } from "react";

type UserAvatarProps = {
  src?: string | null;
  name?: string | null;
  className?: string;
  iconSize?: number;
  showInitials?: boolean;
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
}: UserAvatarProps) {
  const [imageError, setImageError] = useState(false);

  const initials = useMemo(() => {
    return showInitials ? getInitials(name) : "";
  }, [showInitials, name]);

  const hasValidImage = Boolean(src) && !imageError;

  return (
    <div
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-100 select-none aspect-square h-10 w-10",
        className
      )}
    >
      {hasValidImage ? (
        <Image
          src={src as string}
          alt={name || "User avatar"}
          fill
          sizes="(max-width: 768px) 40px, 80px"
          onError={() => setImageError(true)}
          className="object-cover"
        />
      ) : initials ? (
        <span className="font-semibold text-slate-600 text-xs tracking-wider">{initials}</span>
      ) : (
        <UserRound size={iconSize} className="text-slate-500" />
      )}
    </div>
  );
}
