import type { Request, Response } from "express";
import { asyncHandler } from "../../../../common/utils/asyncHandler.ts";
import { requireParam } from "../../../../common/utils/requireParam.ts";
import { successResponse } from "../../../../common/utils/response.ts";
import {
  contactMessageIdParamSchema,
  createContactMessageSchema,
  listContactMessagesQuerySchema,
  updateContactMessageSchema,
} from "../validators/contact.validators.ts";
import {
  createContactMessage,
  listContactMessages,
  updateContactMessage,
} from "../services/contact.service.ts";

export const createContactMessageHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const input = createContactMessageSchema.parse(req.body);
    successResponse(
      res,
      await createContactMessage(input),
      "Contact message submitted",
      201,
    );
  },
);

export const adminListContactMessagesHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const query = listContactMessagesQuerySchema.parse(req.query);
    successResponse(
      res,
      await listContactMessages(query),
      "Contact messages fetched",
    );
  },
);

export const adminUpdateContactMessageHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = contactMessageIdParamSchema.parse({
      id: requireParam(req.params.id, "id"),
    });
    const input = updateContactMessageSchema.parse(req.body);
    successResponse(
      res,
      await updateContactMessage(id, input),
      "Contact message updated",
    );
  },
);
