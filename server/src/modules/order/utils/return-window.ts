export const RETURN_WINDOW_DAYS = 14;

export const getReturnDeadline = (deliveredAt: Date): Date => {
  const deadline = new Date(deliveredAt);
  deadline.setDate(deadline.getDate() + RETURN_WINDOW_DAYS);
  return deadline;
};

export const isReturnWindowOpen = (
  deliveredAt: Date | null | undefined,
  now: Date = new Date()
): boolean => {
  if (!deliveredAt) return false;
  return now.getTime() <= getReturnDeadline(deliveredAt).getTime();
};
