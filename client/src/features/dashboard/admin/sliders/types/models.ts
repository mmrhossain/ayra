export type Envelope<T> = {
  success: true;
  message: string;
  data: T;
};

export type SliderListItem = {
  id: string;
  title: string;
  imageUrl: string | null;
  imagePublicId?: string | null;
  mobileImageUrl?: string | null;
  mobileImagePublicId?: string | null;
  redirectUrl?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  priority: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type SliderPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type SliderListResult = {
  items: SliderListItem[];
  pagination: SliderPagination;
};

export type SliderListParams = {
  page?: number;
  limit?: number;
  title?: string;
  isActive?: boolean;
};

export type CreateSliderBody = {
  title: string;
  imageUrl: string;
  imagePublicId?: string;
  mobileImageUrl?: string;
  mobileImagePublicId?: string;
  redirectUrl?: string;
  startDate?: string;
  endDate?: string;
  priority?: number;
  isActive?: boolean;
};

export type UpdateSliderBody = Partial<CreateSliderBody>;
