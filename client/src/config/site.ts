const normalize = (value: string | undefined): string =>
  value?.trim().replace(/\/+$/, "") || "";

export const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME?.trim() || "Ayra";

export const PUBLIC_SITE_URL = normalize(process.env.NEXT_PUBLIC_SITE_URL) || undefined;
export const SITE_URL = PUBLIC_SITE_URL || "http://localhost:3000";

export function getPublicSiteUrl(): string {
  if (PUBLIC_SITE_URL) return PUBLIC_SITE_URL;
  if (process.env.NODE_ENV !== "production") return SITE_URL;

  throw new Error("NEXT_PUBLIC_SITE_URL must be set to the production site URL.");
}

export const SUPPORT_EMAIL =
  process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim() || "support@example.com";

export const SITE_LOGO =
  process.env.NEXT_PUBLIC_LOGO?.trim() || "/images/logo/logo.png";

export const INSTAGRAM_URL =
  normalize(process.env.NEXT_PUBLIC_INSTAGRAM_URL) || "https://www.instagram.com/ayra";

export function getWhatsAppUrl(supportPhone: string): string {
  const phoneDigits = supportPhone.replace(/\D/g, "");
  if (!phoneDigits) return "";

  const internationalPhone = phoneDigits.startsWith("00")
    ? phoneDigits.slice(2)
    : phoneDigits.startsWith("0")
      ? `88${phoneDigits}`
      : phoneDigits;

  return `https://wa.me/${internationalPhone}?text=Hello%20I%20have%20a%20question`;
}

export const SOCIAL_LINKS = [
  { label: "Facebook", href: normalize(process.env.NEXT_PUBLIC_FACEBOOK_URL) },
  { label: "Instagram", href: INSTAGRAM_URL },
  { label: "TikTok", href: normalize(process.env.NEXT_PUBLIC_TIKTOK_URL) },
  { label: "YouTube", href: normalize(process.env.NEXT_PUBLIC_YOUTUBE_URL) },
].filter((link) => link.href.length > 0);

export function getSocialDisplayLinks(supportPhone: string) {
  const configuredLinks = new Map(SOCIAL_LINKS.map((link) => [link.label, link.href]));
  const whatsAppUrl = getWhatsAppUrl(supportPhone);
  const tikTokUrl = configuredLinks.get("TikTok");

  return [
    { label: "Facebook", href: configuredLinks.get("Facebook") || "#" },
    { label: "Instagram", href: configuredLinks.get("Instagram") || "#" },
    ...(whatsAppUrl ? [{ label: "WhatsApp", href: whatsAppUrl }] : []),
    ...(tikTokUrl ? [{ label: "TikTok", href: tikTokUrl }] : []),
    { label: "YouTube", href: configuredLinks.get("YouTube") || "#" },
  ];
}
