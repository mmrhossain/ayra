import { prisma, transaction } from "../../../../lib/prisma.ts";
import { AppError } from "../../../../common/errors/AppError.ts";
import { paginated } from "../../../../common/utils/paginate.ts";
import { sanitizeHtml } from "../../../../common/utils/sanitize-html.ts";
import type {
  CreateLegalDocumentInput,
  LegalType,
  UpdateLegalDocumentInput,
} from "../types.ts";

export const getPublishedLegal = async (type: LegalType) => {
  const doc = await prisma.legalDocument.findFirst({
    where: { type, status: "PUBLISHED" },
    select: {
      type: true,
      version: true,
      title: true,
      body: true,
      effectiveAt: true,
      updatedAt: true,
    },
  });

  if (!doc) throw new AppError("Legal document not found", 404);
  return { ...doc, body: sanitizeHtml(doc.body) };
};

export const listLegalDocuments = async (
  page: number,
  limit: number,
  type?: LegalType
) => {
  const where = type ? { type } : {};
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    prisma.legalDocument.findMany({
      where,
      orderBy: [{ type: "asc" }, { createdAt: "desc" }],
      skip,
      take: limit,
    }),
    prisma.legalDocument.count({ where }),
  ]);

  return paginated(items, page, limit, total);
};

export const createLegalDocument = async (input: CreateLegalDocumentInput) => {
  const existing = await prisma.legalDocument.findUnique({
    where: { type_version: { type: input.type, version: input.version } },
  });
  if (existing) {
    throw new AppError("A document with this type and version already exists", 409);
  }

  return prisma.legalDocument.create({
    data: {
      type: input.type,
      version: input.version,
      title: input.title,
      body: sanitizeHtml(input.body),
      effectiveAt: input.effectiveAt ?? null,
      status: "DRAFT",
    },
  });
};

export const updateLegalDocument = async (
  id: string,
  input: UpdateLegalDocumentInput
) => {
  const existing = await prisma.legalDocument.findUnique({ where: { id } });
  if (!existing) throw new AppError("Legal document not found", 404);
  if (existing.status === "PUBLISHED") {
    throw new AppError("Published documents cannot be edited; create a new version", 409);
  }

  if (input.version && input.version !== existing.version) {
    const clash = await prisma.legalDocument.findUnique({
      where: { type_version: { type: existing.type, version: input.version } },
    });
    if (clash) {
      throw new AppError("A document with this type and version already exists", 409);
    }
  }

  return prisma.legalDocument.update({
    where: { id },
    data: {
      ...(input.version !== undefined && { version: input.version }),
      ...(input.title !== undefined && { title: input.title }),
      ...(input.body !== undefined && { body: sanitizeHtml(input.body) }),
      ...(input.effectiveAt !== undefined && { effectiveAt: input.effectiveAt }),
    },
  });
};

export const publishLegalDocument = async (id: string) => {
  const existing = await prisma.legalDocument.findUnique({ where: { id } });
  if (!existing) throw new AppError("Legal document not found", 404);
  if (existing.status === "PUBLISHED") {
    throw new AppError("Document is already published", 409);
  }

  return transaction(async (tx) => {
    await tx.legalDocument.updateMany({
      where: { type: existing.type, status: "PUBLISHED" },
      data: { status: "ARCHIVED" },
    });

    return tx.legalDocument.update({
      where: { id },
      data: {
        status: "PUBLISHED",
        effectiveAt: existing.effectiveAt ?? new Date(),
      },
    });
  });
};
