import { z } from "zod";
import { paginationQuerySchema } from "../../common/validators/pagination.ts";

export const listInAppNotificationsQuerySchema = paginationQuerySchema.extend({
  unreadOnly: z
    .enum(["true", "false"])
    .optional()
    .transform((value) => value === "true"),
});
