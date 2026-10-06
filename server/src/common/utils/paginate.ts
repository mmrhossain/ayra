import type { Paginated, Pagination } from "../types/pagination.ts";

export const paginate = (
  page: number,
  limit: number,
  total: number,
): Pagination => ({
  page,
  limit,
  total,
  totalPages: Math.ceil(total / limit) || 0,
});

export const paginated = <T>(
  items: T[],
  page: number,
  limit: number,
  total: number,
): Paginated<T> => ({
  items,
  pagination: paginate(page, limit, total),
});
