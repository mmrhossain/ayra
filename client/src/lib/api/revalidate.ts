"use server";

import { revalidateTag } from "next/cache";

export async function revalidateStorefrontTags(tags: string[]) {
  for (const tag of tags) {
    if (tag) revalidateTag(tag, "max");
  }
}
