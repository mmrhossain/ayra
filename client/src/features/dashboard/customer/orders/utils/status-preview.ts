export const HAPPY_PATH_STEPS = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "PACKED",
  "SHIPPED",
  "DELIVERED",
] as const;

export const EXCEPTION_STATUSES = [
  "CANCELLED",
  "RETURN_REQUESTED",
  "RETURNED",
  "REFUNDED",
] as const;

export type HappyPathStatus = (typeof HAPPY_PATH_STEPS)[number];
export type ExceptionStatus = (typeof EXCEPTION_STATUSES)[number];

export type OrderStatusHistoryEntry = {
  id: string;
  status: string;
  remarks?: string | null;
  createdAt: string;
};

export type OrderStatusStep = {
  status: HappyPathStatus;
  label: string;
  copy: string;
};

export type OrderStatusEvent = {
  id: string;
  status: string;
  label: string;
  remarks: string | null;
  createdAt: string;
};

export type OrderStatusPreview = {
  steps: OrderStatusStep[];
  currentIndex: number;
  exception: ExceptionStatus | null;
  events: OrderStatusEvent[];
};

const STEP_COPY: Record<HappyPathStatus, { label: string; copy: string }> = {
  PENDING: {
    label: "Placed",
    copy: "We received your order and are getting it ready.",
  },
  CONFIRMED: {
    label: "Confirmed",
    copy: "Your order is confirmed and will be prepared next.",
  },
  PROCESSING: {
    label: "Processing",
    copy: "We are preparing your items.",
  },
  PACKED: {
    label: "Packed",
    copy: "Your order is packed and waiting to ship.",
  },
  SHIPPED: {
    label: "Shipped",
    copy: "Your order is on the way.",
  },
  DELIVERED: {
    label: "Delivered",
    copy: "Your order has been delivered.",
  },
};

const EXCEPTION_LABELS: Record<ExceptionStatus, string> = {
  CANCELLED: "Cancelled",
  RETURN_REQUESTED: "Return requested",
  RETURNED: "Returned",
  REFUNDED: "Refunded",
};

const isHappyPath = (status: string): status is HappyPathStatus =>
  (HAPPY_PATH_STEPS as readonly string[]).includes(status);

const isException = (status: string): status is ExceptionStatus =>
  (EXCEPTION_STATUSES as readonly string[]).includes(status);

const labelFor = (status: string): string => {
  if (isHappyPath(status)) return STEP_COPY[status].label;
  if (isException(status)) return EXCEPTION_LABELS[status];
  return status
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

export const toOrderStatusPreview = (
  status: string,
  history: OrderStatusHistoryEntry[] = [],
): OrderStatusPreview => {
  const steps: OrderStatusStep[] = HAPPY_PATH_STEPS.map((step) => ({
    status: step,
    label: STEP_COPY[step].label,
    copy: STEP_COPY[step].copy,
  }));

  const exception = isException(status) ? status : null;

  let currentIndex = HAPPY_PATH_STEPS.indexOf("PENDING");
  if (isHappyPath(status)) {
    currentIndex = HAPPY_PATH_STEPS.indexOf(status);
  } else {
    const lastHappy = [...history]
      .reverse()
      .find((entry) => isHappyPath(entry.status));
    if (lastHappy && isHappyPath(lastHappy.status)) {
      currentIndex = HAPPY_PATH_STEPS.indexOf(lastHappy.status);
    }
  }

  const events: OrderStatusEvent[] = history.map((entry) => ({
    id: entry.id,
    status: entry.status,
    label: labelFor(entry.status),
    remarks: entry.remarks ?? null,
    createdAt: entry.createdAt,
  }));

  return { steps, currentIndex, exception, events };
};
