"use client";

import dynamic from "next/dynamic";

const StorefrontChat = dynamic(
  () => import("@/features/content/components/chat/StorefrontChat"),
  { ssr: false },
);

const SocialContact = dynamic(
  () => import("@/components/shared/SocialContact"),
  { ssr: false },
);

export default function StorefrontDeferredWidgets() {
  return (
    <>
      <SocialContact />
      <StorefrontChat />
    </>
  );
}
