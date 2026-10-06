import { prisma } from "./src/lib/prisma.ts";

try {
  const r = await prisma.category.create({
    data: {
      name: `tmp-${Date.now()}`,
      slug: `tmp-${Date.now()}`,
      isActive: true,
    },
  });
  console.log("ok", r.id);
  await prisma.category.delete({ where: { id: r.id } });
} catch (e) {
  const err = e as { code?: string; message?: string; meta?: unknown };
  console.error("CODE", err.code);
  console.error("MSG", err.message);
  console.error("META", JSON.stringify(err.meta));
} finally {
  await prisma.$disconnect();
}
