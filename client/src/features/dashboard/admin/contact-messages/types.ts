import type { Envelope } from "@/lib/api/dashboard";

export type ContactMessageStatus = "NEW" | "READ" | "RESOLVED";

export type ContactMessage = {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  message: string;
  status: ContactMessageStatus;
  createdAt: string;
  updatedAt: string;
};

export type ContactMessageListResult = {
  items: ContactMessage[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type ContactMessageEnvelope<T> = Envelope<T>;
