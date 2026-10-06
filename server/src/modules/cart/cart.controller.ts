import type { Request, Response } from "express";
import { asyncHandler } from "../../common/utils/asyncHandler.ts";
import { requireParam } from "../../common/utils/requireParam.ts";
import { successResponse } from "../../common/utils/response.ts";
import { AppError } from "../../common/errors/AppError.ts";
import { getOrCreateCustomerProfile } from "../../common/utils/customerProfile.ts";
import {
    addItemSchema,
    updateItemSchema,
    applyCouponSchema,
    guestCartSchema,
    saveGuestCartSchema,
    mergeGuestCartSchema,
} from "./cart.validator.ts";
import {
    getCart,
    addItem,
    updateItemQuantity,
    removeItem,
    clearCart,
    getGuestCart,
    saveGuestCart,
    mergeGuestCart,
    applyCoupon,
    removeCoupon,
} from "./cart.service.ts";

export const getCartHandler = asyncHandler(async (req: Request, res: Response) => {
    if (!req.auth) throw new AppError("Unauthorized", 401);

    const customerProfile = await getOrCreateCustomerProfile(req.auth.user.id);
    successResponse(res, await getCart(customerProfile.id), "Cart fetched");
});

export const addItemHandler = asyncHandler(async (req: Request, res: Response) => {
    if (!req.auth) throw new AppError("Unauthorized", 401);

    const input = addItemSchema.parse(req.body);
    const customerProfile = await getOrCreateCustomerProfile(req.auth.user.id);
    successResponse(
        res,
        await addItem(customerProfile.id, input.variantId, input.quantity),
        "Item added to cart"
    );
});

export const updateItemHandler = asyncHandler(
    async (req: Request, res: Response) => {
        if (!req.auth) throw new AppError("Unauthorized", 401);

        const input = updateItemSchema.parse(req.body);
        const customerProfile = await getOrCreateCustomerProfile(req.auth.user.id);
        successResponse(
            res,
            await updateItemQuantity(
                customerProfile.id,
                requireParam(req.params.variantId, "variantId"),
                input.quantity
            ),
            "Cart item updated"
        );
    }
);

export const removeItemHandler = asyncHandler(
    async (req: Request, res: Response) => {
        if (!req.auth) throw new AppError("Unauthorized", 401);

        const customerProfile = await getOrCreateCustomerProfile(req.auth.user.id);
        successResponse(
            res,
            await removeItem(customerProfile.id, requireParam(req.params.variantId, "variantId")),
            "Item removed from cart"
        );
    }
);

export const clearCartHandler = asyncHandler(
    async (req: Request, res: Response) => {
        if (!req.auth) throw new AppError("Unauthorized", 401);

        const customerProfile = await getOrCreateCustomerProfile(req.auth.user.id);
        successResponse(res, await clearCart(customerProfile.id), "Cart cleared");
    }
);

export const getGuestCartHandler = asyncHandler(
    async (req: Request, res: Response) => {
        const input = guestCartSchema.parse({ sessionId: req.query.sessionId });
        successResponse(res, await getGuestCart(input.sessionId), "Guest cart fetched");
    }
);

export const saveGuestCartHandler = asyncHandler(
    async (req: Request, res: Response) => {
        // Fixed: using saveGuestCartSchema to correctly validate body including cartData
        const input = saveGuestCartSchema.parse(req.body);
        successResponse(
            res,
            await saveGuestCart(input.sessionId, input.cartData),
            "Guest cart saved"
        );
    }
);

export const mergeGuestCartHandler = asyncHandler(
    async (req: Request, res: Response) => {
        if (!req.auth) throw new AppError("Unauthorized", 401);

        const input = mergeGuestCartSchema.parse(req.body);
        const customerProfile = await getOrCreateCustomerProfile(req.auth.user.id);
        successResponse(
            res,
            await mergeGuestCart(customerProfile.id, input.sessionId),
            "Guest cart merged"
        );
    }
);

export const applyCouponHandler = asyncHandler(
    async (req: Request, res: Response) => {
        if (!req.auth) throw new AppError("Unauthorized", 401);

        const input = applyCouponSchema.parse(req.body);
        const customerProfile = await getOrCreateCustomerProfile(req.auth.user.id);
        successResponse(
            res,
            await applyCoupon(customerProfile.id, input.code),
            "Coupon applied"
        );
    }
);

export const removeCouponHandler = asyncHandler(
    async (req: Request, res: Response) => {
        if (!req.auth) throw new AppError("Unauthorized", 401);

        const customerProfile = await getOrCreateCustomerProfile(req.auth.user.id);
        successResponse(res, await removeCoupon(customerProfile.id), "Coupon removed");
    }
);