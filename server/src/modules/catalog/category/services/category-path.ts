import type { Prisma } from "../../../../generated/prisma/client.ts";

/** Match every ancestor in one query, including the requirement for a root parent. */
export function categoryPathWhere(segments: string[], includeInactive = false): Prisma.CategoryWhereInput | null {
  let where: Prisma.CategoryWhereInput | null = null;
  for (const slug of segments) {
    const ancestor: Prisma.CategoryWhereInput | null = where;
    where = {
      slug,
      deletedAt: null,
      ...(includeInactive ? {} : { isActive: true }),
      ...(ancestor ? { parent: { is: ancestor } } : { parentId: null }),
    };
  }
  return where;
}
