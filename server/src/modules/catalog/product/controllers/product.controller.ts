import type { Request, Response } from "express";
import { asyncHandler } from "../../../../common/utils/asyncHandler.ts";
import { requireParam } from "../../../../common/utils/requireParam.ts";
import { successResponse } from "../../../../common/utils/response.ts";
import {
  createProductSchema,
  updateProductSchema,
  createVariantSchema,
  updateVariantSchema,
  listProductsQuerySchema,
} from "../validators/product.validators.ts";
import {
  listProducts,
  getProductBySlug,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  createVariant,
  updateVariant,
  deleteVariant,
} from "../services/product.service.ts";

export const getProducts = asyncHandler(async (req: Request, res: Response) => {
  const query = listProductsQuerySchema.parse(req.query);
  const role = req.auth?.user.role;
  const isStaff = role === "ADMIN" || role === "VENDOR";

  successResponse(
    res,
    await listProducts({
      ...query,
      includeInactive: query.includeInactive === true && isStaff,
      status: isStaff ? query.status : undefined,
    }),
    "Products fetched"
  );
});

export const getProduct = asyncHandler(async (req: Request, res: Response) => {
  successResponse(
    res,
    await getProductBySlug(requireParam(req.params.slug, "slug"), false),
    "Product fetched"
  );
});

export const adminGetProductHandler = asyncHandler(
  async (req: Request, res: Response) => {
    successResponse(
      res,
      await getProductById(requireParam(req.params.id, "id")),
      "Product fetched"
    );
  }
);

export const createProductHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const input = createProductSchema.parse(req.body);
    successResponse(res, await createProduct(input), "Product created", 201);
  }
);

export const updateProductHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const input = updateProductSchema.parse(req.body);
    successResponse(
      res,
      await updateProduct(requireParam(req.params.id, "id"), input),
      "Product updated"
    );
  }
);

export const deleteProductHandler = asyncHandler(
  async (req: Request, res: Response) => {
    successResponse(
      res,
      await deleteProduct(requireParam(req.params.id, "id")),
      "Product deleted"
    );
  }
);

export const createVariantHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const input = createVariantSchema.parse(req.body);
    successResponse(
      res,
      await createVariant(requireParam(req.params.productId, "productId"), input),
      "Variant created",
      201
    );
  }
);

export const updateVariantHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const input = updateVariantSchema.parse(req.body);
    successResponse(
      res,
      await updateVariant(requireParam(req.params.id, "id"), input),
      "Variant updated"
    );
  }
);

export const deleteVariantHandler = asyncHandler(
  async (req: Request, res: Response) => {
    successResponse(
      res,
      await deleteVariant(requireParam(req.params.id, "id")),
      "Variant deleted"
    );
  }
);
