import type { Request, Response } from "express";
import { asyncHandler } from "../../../common/utils/asyncHandler.ts";
import { requireParam } from "../../../common/utils/requireParam.ts";
import { successResponse } from "../../../common/utils/response.ts";
import { AppError } from "../../../common/errors/AppError.ts";
import { getOrCreateCustomerProfile } from "../../../common/utils/customerProfile.ts";
import {
  createAddressSchema,
  updateAddressSchema,
} from "../validators/address.validators.ts";
import {
  createAddress,
  listAddresses,
  getAddress,
  updateAddress,
  deleteAddress,
} from "../services/address.service.ts";

export const createAddressHandler = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.auth) throw new AppError("Unauthorized", 401);

    const input = createAddressSchema.parse(req.body);
    const customerProfile = await getOrCreateCustomerProfile(req.auth.user.id);

    successResponse(
      res,
      await createAddress(customerProfile.id, input),
      "Address created",
      201
    );
  }
);

export const listAddressesHandler = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.auth) throw new AppError("Unauthorized", 401);

    const customerProfile = await getOrCreateCustomerProfile(req.auth.user.id);

    successResponse(
      res,
      await listAddresses(customerProfile.id),
      "Addresses fetched"
    );
  }
);

export const getAddressHandler = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.auth) throw new AppError("Unauthorized", 401);

    const customerProfile = await getOrCreateCustomerProfile(req.auth.user.id);

    successResponse(
      res,
      await getAddress(
        customerProfile.id,
        requireParam(req.params.id, "id")
      ),
      "Address fetched"
    );
  }
);

export const updateAddressHandler = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.auth) throw new AppError("Unauthorized", 401);

    const input = updateAddressSchema.parse(req.body);
    const customerProfile = await getOrCreateCustomerProfile(req.auth.user.id);

    successResponse(
      res,
      await updateAddress(
        customerProfile.id,
        requireParam(req.params.id, "id"),
        input
      ),
      "Address updated"
    );
  }
);

export const deleteAddressHandler = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.auth) throw new AppError("Unauthorized", 401);

    const customerProfile = await getOrCreateCustomerProfile(req.auth.user.id);

    successResponse(
      res,
      await deleteAddress(
        customerProfile.id,
        requireParam(req.params.id, "id")
      ),
      "Address deleted"
    );
  }
);
