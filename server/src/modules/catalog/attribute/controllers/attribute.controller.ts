import type { Request, Response } from "express";
import { asyncHandler } from "../../../../common/utils/asyncHandler.ts";
import { requireParam } from "../../../../common/utils/requireParam.ts";
import { successResponse } from "../../../../common/utils/response.ts";
import {
  createAttributeSchema,
  createAttributeValuesSchema,
  createAttributeValueSchema,
  updateAttributeSchema,
  updateAttributeValueSchema,
} from "../validators/attribute.validators.ts";
import {
  createAttribute,
  createAttributeValue,
  createAttributeValues,
  deleteAttribute,
  deleteAttributeValue,
  getAttribute,
  listAttributes,
  updateAttribute,
  updateAttributeValue,
} from "../services/attribute.service.ts";

export const getAttributes = asyncHandler(
  async (_req: Request, res: Response) => {
    successResponse(res, await listAttributes(), "Attributes fetched");
  }
);

export const getAttributeHandler = asyncHandler(
  async (req: Request, res: Response) => {
    successResponse(
      res,
      await getAttribute(requireParam(req.params.id, "id")),
      "Attribute fetched"
    );
  }
);

export const createAttributeHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const input = createAttributeSchema.parse(req.body);
    successResponse(res, await createAttribute(input), "Attribute created", 201);
  }
);

export const updateAttributeHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const input = updateAttributeSchema.parse(req.body);
    successResponse(
      res,
      await updateAttribute(requireParam(req.params.id, "id"), input),
      "Attribute updated"
    );
  }
);

export const deleteAttributeHandler = asyncHandler(
  async (req: Request, res: Response) => {
    successResponse(
      res,
      await deleteAttribute(requireParam(req.params.id, "id")),
      "Attribute deleted"
    );
  }
);

export const createAttributeValueHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const input = createAttributeValueSchema.parse(req.body);
    successResponse(
      res,
      await createAttributeValue(
        requireParam(req.params.attributeId, "attributeId"),
        input
      ),
      "Attribute value created",
      201
    );
  }
);

export const createAttributeValuesHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const input = createAttributeValuesSchema.parse(req.body);
    successResponse(
      res,
      await createAttributeValues(
        requireParam(req.params.attributeId, "attributeId"),
        input
      ),
      "Attribute values created",
      201
    );
  }
);

export const updateAttributeValueHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const input = updateAttributeValueSchema.parse(req.body);
    successResponse(
      res,
      await updateAttributeValue(requireParam(req.params.id, "id"), input),
      "Attribute value updated"
    );
  }
);

export const deleteAttributeValueHandler = asyncHandler(
  async (req: Request, res: Response) => {
    successResponse(
      res,
      await deleteAttributeValue(requireParam(req.params.id, "id")),
      "Attribute value deleted"
    );
  }
);
