export type NotificationLevel = "INFO" | "SUCCESS" | "WARNING" | "ERROR";

export type InAppNotification = {
  id: string;
  title: string;
  body: string;
  href: string | null;
  level: NotificationLevel;
  read: boolean;
  readAt: string | null;
  createdAt: string;
};

export type NotificationPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type NotificationListResult = {
  items: InAppNotification[];
  unreadCount: number;
  pagination: NotificationPagination;
};

export type NotificationListParams = {
  page?: number;
  limit?: number;
  unreadOnly?: boolean;
};

export type Envelope<T> = {
  success: true;
  message: string;
  data: T;
};
