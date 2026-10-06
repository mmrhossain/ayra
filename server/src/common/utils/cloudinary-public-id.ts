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

    const last = publicSegments[publicSegments.length - 1];
    if (!last) return null;
    publicSegments[publicSegments.length - 1] = last.replace(
      /\.[a-z0-9]+$/i,
      ""
    );

    return publicSegments.join("/") || null;
  } catch {
    return null;
  }
};

export const resolveImagePublicId = (
  explicit?: string | null,
  url?: string | null
): string | null => {
  const trimmed = explicit?.trim();
  if (trimmed) return trimmed;
  return extractCloudinaryPublicId(url);
};
