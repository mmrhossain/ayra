const normalize = (value: string | undefined): string => (value ? value.replace(/\/+$/, "") : "");

export const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME?.trim() || "Ayra";

export const SITE_URL = normalize(process.env.NEXT_PUBLIC_SITE_URL) || "http://localhost:3000";

export const SUPPORT_EMAIL =
  process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim() || "support@example.com";

export const SITE_LOGO =
  process.env.NEXT_PUBLIC_LOGO?.trim() || "/images/logo/logo.png";

export const SOCIAL_LINKS = [
  { label: "Facebook", href: normalize(process.env.NEXT_PUBLIC_FACEBOOK_URL) },
  { label: "Instagram", href: normalize(process.env.NEXT_PUBLIC_INSTAGRAM_URL) },
  { label: "TikTok", href: normalize(process.env.NEXT_PUBLIC_TIKTOK_URL) },
  { label: "YouTube", href: normalize(process.env.NEXT_PUBLIC_YOUTUBE_URL) },
].filter((link) => link.href.length > 0);
