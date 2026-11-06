import type { Request, Response } from "express";
import { asyncHandler } from "../../common/utils/asyncHandler.ts";
import { requireParam } from "../../common/utils/requireParam.ts";
import { successResponse } from "../../common/utils/response.ts";
import { AppError } from "../../common/errors/AppError.ts";
import {
  getInAppUnreadCount,
  listInAppNotifications,
  markAllInAppNotificationsRead,
  markInAppNotificationRead,
} from "./in-app.service.ts";
import { listInAppNotificationsQuerySchema } from "./notification.validators.ts";

const requireUserId = (req: Request): string => {
  if (!req.auth) throw new AppError("Unauthorized", 401);
  return req.auth.user.id;
};

export const listInAppNotificationsHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = requireUserId(req);
    const query = listInAppNotificationsQuerySchema.parse(req.query);

    successResponse(
      res,
      await listInAppNotifications({ userId, ...query }),
      "Notifications fetched",
    );
  },
);

export const getInAppUnreadCountHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = requireUserId(req);
    successResponse(
      res,
      { unreadCount: await getInAppUnreadCount(userId) },
      "Unread count fetched",
    );
  },
);

export const markInAppNotificationReadHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = requireUserId(req);
    successResponse(
      res,
      await markInAppNotificationRead(
        userId,
        requireParam(req.params.id, "id"),
      ),
      "Notification marked as read",
    );
  },
);

export const markAllInAppNotificationsReadHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = requireUserId(req);
    successResponse(
      res,
      await markAllInAppNotificationsRead(userId),
      "Notifications marked as read",
    );
  },
);
