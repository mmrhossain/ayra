export type Envelope<T> = {
  success: true;
  message: string;
  data: T;
};

export type WarehouseListItem = {
  id: string;
  name: string;
  code: string;
  phone?: string | null;
  email?: string | null;
  country: string;
  state?: string | null;
  city: string;
  addressLine1: string;
  addressLine2?: string | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type CreateWarehouseBody = {
  name: string;
  code: string;
  phone?: string;
  email?: string;
  country: string;
  state?: string;
  city: string;
  addressLine1: string;
  addressLine2?: string;
  isActive: boolean;
};

export type UpdateWarehouseBody = Partial<CreateWarehouseBody>;

export type WarehousePagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type WarehouseListResult = {
  items: WarehouseListItem[];
  pagination: WarehousePagination;
};

export type WarehouseListParams = {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
};
