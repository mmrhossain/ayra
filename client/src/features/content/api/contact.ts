import { api } from "@/lib/api/store-front";
import type { ContactFormData } from "@/features/content/schemas";
import type { Envelope } from "@/features/content/types";

type ContactMessageCreated = {
  id: string;
  createdAt: string;
};

export async function submitContactMessage(
  body: ContactFormData,
): Promise<ContactMessageCreated> {
  const res = await api.post<Envelope<ContactMessageCreated>>(
    "/contact-messages",
    { body },
  );
  return res.data;
}
