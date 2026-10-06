import type { PaymentMethod } from "../../../generated/prisma/enums.ts";
import { AppError } from "../../../common/errors/AppError.ts";
import type { PaymentProvider } from "../types.ts";
import { codProvider } from "./cod.provider.ts";
import { sslcommerzProvider } from "./sslcommerz.provider.ts";

const providers: Partial<Record<PaymentMethod, PaymentProvider>> = {
  COD: codProvider,
  SSLCOMMERZ: sslcommerzProvider,
};

export const getPaymentProvider = (method: PaymentMethod): PaymentProvider => {
  const provider = providers[method];

  if (!provider) {
    throw new AppError(`Payment method ${method} is not supported`, 400);
  }

  return provider;
};
