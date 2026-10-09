export const uniquePublicId = (value?: string | null): string | null => {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const last = trimmed.split("/").filter(Boolean).pop();
  if (!last) return null;
  return last.replace(/\.[a-z0-9]+$/i, "") || null;
};

export const extractCloudinaryPublicId = (
  url?: string | null
): string | null => {
  if (!url) return null;

  try {
    const parsed = new URL(url);
    const marker = "/image/upload/";
    const index = parsed.pathname.indexOf(marker);
    if (index === -1) return null;

    let rest = decodeURIComponent(parsed.pathname.slice(index + marker.length));
    rest = rest.replace(/^v\d+\//, "");

    const segments = rest.split("/").filter(Boolean);
    const publicSegments = segments.filter(
      (segment) => !segment.includes(",") && !/^[a-z]+_.+/i.test(segment)
    );
    if (publicSegments.length === 0) return null;

    return uniquePublicId(publicSegments.join("/"));
  } catch {
    return null;
  }
};

export const resolveImagePublicId = (
  explicit?: string | null,
  url?: string | null
): string | null => {
  return uniquePublicId(explicit) ?? extractCloudinaryPublicId(url);
};
