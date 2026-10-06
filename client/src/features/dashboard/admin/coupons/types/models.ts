export type Envelope<T> = {
  success: true;
  message: string;
  data: T;
};

export const COUPON_STATUSES = [
  "DRAFT",
  "ACTIVE",
  "EXPIRED",
  "DISABLED",
] as const;

export const DISCOUNT_TYPES = [
  "PERCENTAGE",
  "FIXED_AMOUNT",
  "FREE_SHIPPING",
] as const;

export type CouponStatus = (typeof COUPON_STATUSES)[number];
export type DiscountType = (typeof DISCOUNT_TYPES)[number];

export type CouponListItem = {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  status: CouponStatus;
  discountType: DiscountType;
  discountValue: number | string;
  minimumOrderAmount?: number | string | null;
  maximumDiscountAmount?: number | string | null;
  usageLimit?: number | null;
  usageCount?: number;
  usageLimitPerCustomer?: number | null;
  startsAt: string;
  expiresAt: string;
  isActive: boolean;
  applicableProductIds?: string[];
  applicableCategoryIds?: string[];
};

export type CouponPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type CouponListResult = {
  items: CouponListItem[];
  pagination: CouponPagination;
};

export type CouponListParams = {
  page?: number;
  limit?: number;
  search?: string;
};

export type CreateCouponBody = {
  code: string;
  name: string;
  description?: string | null;
  status: CouponStatus;
  discountType: DiscountType;
  discountValue: number;
  minimumOrderAmount?: number | null;
  maximumDiscountAmount?: number | null;
  usageLimit?: number | null;
  usageLimitPerCustomer?: number | null;
  startsAt: string;
  expiresAt: string;
  isActive: boolean;
  applicableProductIds: string[];
  applicableCategoryIds: string[];
};
