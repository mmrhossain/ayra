import { dashboardApi } from "@/lib/api/dashboard";
import type {
  ContactMessage,
  ContactMessageEnvelope,
  ContactMessageListResult,
  ContactMessageStatus,
} from "@/features/dashboard/admin/contact-messages/types";

export async function fetchContactMessages(params: {
  page: number;
  limit: number;
  status?: ContactMessageStatus;
}): Promise<ContactMessageListResult> {
  const res = await dashboardApi.get<
    ContactMessageEnvelope<ContactMessageListResult>
  >("/admin/contact-messages", {
    cache: "no-store",
    params,
  });
  return res.data;
}

export async function updateContactMessageStatus(
  id: string,
  status: ContactMessageStatus,
): Promise<ContactMessage> {
  const res = await dashboardApi.patch<ContactMessageEnvelope<ContactMessage>>(
    `/admin/contact-messages/${id}`,
    { body: { status } },
  );
  return res.data;
}

export function toContactMessageErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong";
}
