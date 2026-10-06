import type { NotificationChannel } from "../../generated/prisma/enums.ts";
import type { Prisma } from "../../generated/prisma/client.ts";

export type TemplateData = Record<
  string,
  string | number | boolean | null | undefined
>;

export type TemplateSeed = {
  code: string;
  name: string;
  channel: NotificationChannel;
  subject: string;
  content: string;
  variables: string[];
};

export type QueuedNotification = {
  id: string;
  channel: string;
  recipient: string;
  subject: string | null;
  content: string;
  metadata: Prisma.JsonValue | null;
};

export type SendResult = {
  provider: string;
  providerMessageId: string | null;
  response: Prisma.InputJsonValue;
};
