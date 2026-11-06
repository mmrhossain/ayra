import { AppError } from "../errors/AppError.ts";

export const slugify = (value: string): string =>
  value
    .trim()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const generateSlug = (value: string, label = "Name"): string => {
  const slug = slugify(value);

  if (!slug) {
    throw new AppError(`${label} cannot be converted into a valid slug`, 400);
  }

  return slug;
};

export const ensureUniqueSlug = (slug: string, taken: Set<string>): string => {
  const normalized = slugify(slug) || slug;
  if (!taken.has(normalized)) {
    taken.add(normalized);
    return normalized;
  }

  let index = 2;
  while (taken.has(`${normalized}-${index}`)) {
    index += 1;
  }
  const next = `${normalized}-${index}`;
  taken.add(next);
  return next;
};
