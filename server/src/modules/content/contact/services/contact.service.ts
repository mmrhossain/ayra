import { AppError } from "../../../../common/errors/AppError.ts";
import { paginated } from "../../../../common/utils/paginate.ts";
import { prisma } from "../../../../lib/prisma.ts";
import type {
  CreateContactMessageInput,
  ListContactMessagesQuery,
  UpdateContactMessageInput,
} from "../types.ts";

export const createContactMessage = (input: CreateContactMessageInput) =>
  prisma.contactMessage.create({
    data: input,
    select: { id: true, createdAt: true },
  });

export const listContactMessages = async (
  query: ListContactMessagesQuery,
) => {
  const where = query.status ? { status: query.status } : {};
  const [items, total] = await Promise.all([
    prisma.contactMessage.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    }),
    prisma.contactMessage.count({ where }),
  ]);

  return paginated(items, query.page, query.limit, total);
};

export const updateContactMessage = async (
  id: string,
  input: UpdateContactMessageInput,
) => {
  const existing = await prisma.contactMessage.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!existing) throw new AppError("Contact message not found", 404);

  return prisma.contactMessage.update({
    where: { id },
    data: { status: input.status },
  });
};
