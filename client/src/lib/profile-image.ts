/** Request a display-sized Google photo without changing the stored profile URL. */
export function profileImageUrl(source: string, size: number): string {
  try {
    const url = new URL(source);
    if (url.protocol !== "https:" || url.hostname !== "lh3.googleusercontent.com") return source;
    const pathname = url.pathname.replace(/=s\d+(?=-|$)/, "=s" + size);
    if (pathname === url.pathname) return source;
    url.pathname = pathname;
    return url.toString();
  } catch {
    return source;
  }
}
