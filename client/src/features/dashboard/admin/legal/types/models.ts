export type Envelope<T> = {
  success: true;
  message: string;
  data: T;
};

export const LEGAL_TYPES = ["PRIVACY", "TERMS"] as const;
export type LegalType = (typeof LEGAL_TYPES)[number];

export const LEGAL_STATUSES = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;
export type LegalStatus = (typeof LEGAL_STATUSES)[number];

export type LegalDocumentItem = {
  id: string;
  type: LegalType;
  version: string;
  title: string;
  body: string;
  status: LegalStatus;
  effectiveAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type LegalPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type LegalListResult = {
  items: LegalDocumentItem[];
  meta: LegalPagination;
};

export type LegalListParams = {
  page?: number;
  limit?: number;
  type?: LegalType;
};

export type CreateLegalBody = {
  type: LegalType;
  version: string;
  title: string;
  body: string;
  effectiveAt?: string;
};

export type UpdateLegalBody = {
  version?: string;
  title?: string;
  body?: string;
  effectiveAt?: string | null;
};
