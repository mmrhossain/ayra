/** Keep internal notification destinations on the active storefront origin. */
export function notificationHref(href: string | null): string | null {
  if (!href || !/^https?:\/\//i.test(href)) return href;
  try {
    const url = new URL(href);
    if (/^\/(customer|admin)(?:\/|$)/.test(url.pathname)) {
      return url.pathname + url.search + url.hash;
    }
  } catch {
    // Preserve existing handling of malformed links.
  }
  return href;
}
