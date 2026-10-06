import type { Request, Response } from "express";
import { asyncHandler } from "../../../common/utils/asyncHandler.ts";
import { requireParam } from "../../../common/utils/requireParam.ts";
import { successResponse } from "../../../common/utils/response.ts";
import {
  createSliderSchema,
  listSlidersQuerySchema,
  updateSliderSchema,
} from "../validators/slider.validators.ts";
import {
  createSlider,
  deleteSlider,
  getSlider,
  listActiveSliders,
  listSliders,
  updateSlider,
} from "../services/slider.service.ts";

export const listActiveSlidersHandler = asyncHandler(
  async (_req: Request, res: Response) => {
    successResponse(res, await listActiveSliders(), "Sliders fetched");
  }
);

export const adminListSlidersHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const query = listSlidersQuerySchema.parse(req.query);
    successResponse(res, await listSliders(query), "Sliders fetched");
  }
);

export const adminGetSliderHandler = asyncHandler(
  async (req: Request, res: Response) => {
    successResponse(
      res,
      await getSlider(requireParam(req.params.id, "id")),
      "Slider fetched"
    );
  }
);

export const createSliderHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const input = createSliderSchema.parse(req.body);
    successResponse(res, await createSlider(input), "Slider created", 201);
  }
);

export const updateSliderHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const input = updateSliderSchema.parse(req.body);
    successResponse(
      res,
      await updateSlider(requireParam(req.params.id, "id"), input),
      "Slider updated"
    );
  }
);

export const deleteSliderHandler = asyncHandler(
  async (req: Request, res: Response) => {
    successResponse(
      res,
      await deleteSlider(requireParam(req.params.id, "id")),
      "Slider deleted"
    );
  }
);
