// Bangladesh has used a fixed UTC+06:00 offset since 2010 and observes no DST.
// Dashboard calendar ranges and sales buckets are therefore anchored to this
// fixed offset so "today" means the Dhaka day, not the server's UTC day.
export const DHAKA_TIME_ZONE = "Asia/Dhaka";
export const DHAKA_OFFSET_MINUTES = 6 * 60;
const DHAKA_OFFSET_MS = DHAKA_OFFSET_MINUTES * 60 * 1000;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

export const startOfDhakaDay = (date: Date): Date => {
  const shifted = new Date(date.getTime() + DHAKA_OFFSET_MS);
  shifted.setUTCHours(0, 0, 0, 0);
  return new Date(shifted.getTime() - DHAKA_OFFSET_MS);
};

export const endOfDhakaDay = (date: Date): Date =>
  new Date(startOfDhakaDay(date).getTime() + MS_PER_DAY - 1);

export const addDhakaDays = (date: Date, days: number): Date =>
  new Date(date.getTime() + days * MS_PER_DAY);

export const startOfDhakaMonth = (date: Date): Date => {
  const start = startOfDhakaDay(date);
  const shifted = new Date(start.getTime() + DHAKA_OFFSET_MS);
  shifted.setUTCDate(1);
  return new Date(shifted.getTime() - DHAKA_OFFSET_MS);
};

export const startOfDhakaYear = (date: Date): Date => {
  const start = startOfDhakaMonth(date);
  const shifted = new Date(start.getTime() + DHAKA_OFFSET_MS);
  shifted.setUTCMonth(0);
  return new Date(shifted.getTime() - DHAKA_OFFSET_MS);
};

export const addDhakaMonths = (date: Date, months: number): Date => {
  const base = startOfDhakaMonth(date);
  const shifted = new Date(base.getTime() + DHAKA_OFFSET_MS);
  shifted.setUTCMonth(shifted.getUTCMonth() + months);
  return new Date(shifted.getTime() - DHAKA_OFFSET_MS);
};

export const addDhakaYears = (date: Date, years: number): Date => {
  const base = startOfDhakaYear(date);
  const shifted = new Date(base.getTime() + DHAKA_OFFSET_MS);
  shifted.setUTCFullYear(shifted.getUTCFullYear() + years);
  return new Date(shifted.getTime() - DHAKA_OFFSET_MS);
};
