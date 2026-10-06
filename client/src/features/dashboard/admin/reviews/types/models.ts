export type Envelope<T> = {
  success: true;
  message: string;
  data: T;
};

export type ReviewStatusFilter = "pending" | "approved" | "rejected";

export type AdminReviewItem = {
  id: string;
  rating: number;
  comment?: string | null;
  isApproved: boolean;
  rejectionReason?: string | null;
  verifiedPurchase: boolean;
  createdAt: string;
  customerProfile?: {
    id?: string;
    customerCode?: string;
    user?: { name?: string | null; email?: string | null } | null;
  } | null;
  product?: { id: string; name: string; slug: string } | null;
};

export type ReviewPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type ReviewListResult = {
  items: AdminReviewItem[];
  pagination: ReviewPagination;
};

export type ReviewListParams = {
  page?: number;
  limit?: number;
  status?: ReviewStatusFilter;
};
