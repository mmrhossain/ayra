import type { Request, Response } from "express";
import { getSettingValue } from "../../settings/settings.service.ts";
import { asyncHandler } from "../../../common/utils/asyncHandler.ts";
import { requireParam } from "../../../common/utils/requireParam.ts";
import { successResponse } from "../../../common/utils/response.ts";
import { AppError } from "../../../common/errors/AppError.ts";
import { getOrCreateCustomerProfile } from "../../../common/utils/customerProfile.ts";
import {
    initiatePaymentSchema,
    listPaymentsQuerySchema,
    listRefundsQuerySchema,
    refundSchema,
    refundStatusSchema,
    sslcommerzFailCancelSchema,
    sslcommerzIpnSchema,
    sslcommerzSuccessSchema,
} from "../validators/payment.validators.ts";
import {
    collectCodPayment,
    createRefund,
    getPayment,
    initiatePayment,
    listPayments,
    listRefunds,
    updateRefundStatus,
} from "../services/payment.service.ts";
import {
    handleSslcommerzCancel,
    handleSslcommerzFail,
    handleSslcommerzIpn,
    handleSslcommerzSuccess,
} from "../services/sslcommerz.service.ts";

export const initiatePaymentHandler = asyncHandler(
    async (req: Request, res: Response) => {
        if (!req.auth) throw new AppError("Unauthorized", 401);

        const input = initiatePaymentSchema.parse(req.body);
        const customerProfile = await getOrCreateCustomerProfile(req.auth.user.id);

        successResponse(
            res,
            await initiatePayment(
                customerProfile.id,
                requireParam(req.params.orderId, "orderId"),
                input.method
            ),
            "Payment initiated",
            201
        );
    }
);

export const collectCodPaymentHandler = asyncHandler(
    async (req: Request, res: Response) => {
        if (!req.auth) throw new AppError("Unauthorized", 401);

        successResponse(
            res,
            await collectCodPayment(
                requireParam(req.params.paymentId, "paymentId"),
                req.auth.user.id
            ),
            "Payment collected"
        );
    }
);

export const refundPaymentHandler = asyncHandler(
    async (req: Request, res: Response) => {
        if (!req.auth) throw new AppError("Unauthorized", 401);

        const input = refundSchema.parse(req.body);

        successResponse(
            res,
            await createRefund(
                requireParam(req.params.paymentId, "paymentId"),
                input,
                req.auth.user.id
            ),
            "Refund created",
            201
        );
    }
);

export const updateRefundStatusHandler = asyncHandler(
    async (req: Request, res: Response) => {
        if (!req.auth) throw new AppError("Unauthorized", 401);

        const input = refundStatusSchema.parse(req.body);

        successResponse(
            res,
            await updateRefundStatus(
                requireParam(req.params.refundId, "refundId"),
                input,
                req.auth.user.id
            ),
            "Refund updated"
        );
    }
);

// Helper to extract data from body or query (handles both POST and GET redirects)
const getRequestData = (req: Request) => {
    const body =
        req.body && typeof req.body === "object" ? req.body : {};
    return Object.keys(body).length > 0 ? body : req.query;
};

export const sslcommerzSuccessHandler = asyncHandler(
    async (req: Request, res: Response) => {
        const rawData = getRequestData(req);
        const input = sslcommerzSuccessSchema.parse(rawData);

        const frontendUrl = await getSettingValue<string>("store.frontendUrl");

        try {
            const result = await handleSslcommerzSuccess(input);

            // Redirect user browser to frontend success page
            return res.redirect(
                `${frontendUrl}/checkout/payment/success?orderId=${result.payment.orderId}&tran_id=${input.tran_id}`
            );
        } catch {
            return res.redirect(
                `${frontendUrl}/checkout/payment/failed?tran_id=${encodeURIComponent(input.tran_id)}`
            );
        }
    }
);

export const sslcommerzFailHandler = asyncHandler(
    async (req: Request, res: Response) => {
        const rawData = getRequestData(req);
        const input = sslcommerzFailCancelSchema.parse(rawData);

        const result = await handleSslcommerzFail(input);
        const frontendUrl = await getSettingValue<string>("store.frontendUrl");

        return res.redirect(
            `${frontendUrl}/checkout/payment/failed?orderId=${result.payment.orderId}&tran_id=${input.tran_id}`
        );
    }
);

export const sslcommerzCancelHandler = asyncHandler(
    async (req: Request, res: Response) => {
        const rawData = getRequestData(req);
        const input = sslcommerzFailCancelSchema.parse(rawData);

        const result = await handleSslcommerzCancel(input);
        const frontendUrl = await getSettingValue<string>("store.frontendUrl");

        return res.redirect(
            `${frontendUrl}/checkout/payment/cancelled?orderId=${result.payment.orderId}&tran_id=${input.tran_id}`
        );
    }
);

export const sslcommerzIpnHandler = asyncHandler(
    async (req: Request, res: Response) => {
        const input = sslcommerzIpnSchema.parse(req.body);

        successResponse(res, await handleSslcommerzIpn(input), "IPN processed");
    }
);

export const adminListPaymentsHandler = asyncHandler(
    async (req: Request, res: Response) => {
        const query = listPaymentsQuerySchema.parse(req.query);

        successResponse(res, await listPayments(query), "Payments fetched");
    }
);

export const adminListRefundsHandler = asyncHandler(
    async (req: Request, res: Response) => {
        const query = listRefundsQuerySchema.parse(req.query);

        successResponse(res, await listRefunds(query), "Refunds fetched");
    }
);

export const adminGetPaymentHandler = asyncHandler(
    async (req: Request, res: Response) => {
        successResponse(
            res,
            await getPayment(requireParam(req.params.id, "id")),
            "Payment fetched"
        );
    }
);