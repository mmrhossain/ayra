import type { Request, Response } from "express";
import { asyncHandler } from "../../../../common/utils/asyncHandler.ts";
import { requireParam } from "../../../../common/utils/requireParam.ts";
import { successResponse } from "../../../../common/utils/response.ts";
import {
  createLegalDocumentSchema,
  legalTypeParamSchema,
  listLegalQuerySchema,
  updateLegalDocumentSchema,
} from "../validators/legal.validators.ts";
import {
  createLegalDocument,
  getPublishedLegal,
  listLegalDocuments,
  publishLegalDocument,
  updateLegalDocument,
} from "../services/legal.service.ts";

export const getLegalHandler = asyncHandler(async (req: Request, res: Response) => {
  const { type } = legalTypeParamSchema.parse(req.params);
  successResponse(res, await getPublishedLegal(type), "Legal document fetched");
});

export const adminListLegalHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const query = listLegalQuerySchema.parse(req.query);
    successResponse(
      res,
      await listLegalDocuments(query.page, query.limit, query.type),
      "Legal documents fetched"
    );
  }
);

export const adminCreateLegalHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const input = createLegalDocumentSchema.parse(req.body);
    successResponse(res, await createLegalDocument(input), "Legal document created", 201);
  }
);

export const adminUpdateLegalHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const input = updateLegalDocumentSchema.parse(req.body);
    successResponse(
      res,
      await updateLegalDocument(requireParam(req.params.id, "id"), input),
      "Legal document updated"
    );
  }
);

export const adminPublishLegalHandler = asyncHandler(
  async (req: Request, res: Response) => {
    successResponse(
      res,
      await publishLegalDocument(requireParam(req.params.id, "id")),
      "Legal document published"
    );
  }
);
