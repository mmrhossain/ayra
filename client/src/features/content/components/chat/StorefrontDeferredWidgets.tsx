"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const StorefrontChat = dynamic(
  () => import("@/features/content/components/chat/StorefrontChat"), { ssr: false },
);
const SocialContact = dynamic(
  () => import("@/components/shared/SocialContact"), { ssr: false },
);

export default function StorefrontDeferredWidgets() {
  const pathname = usePathname();
  const hidden = pathname !== "/";
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (hidden || ready) return;
    let idleId: number | undefined;
    let timerId: ReturnType<typeof setTimeout> | undefined;
    const events = ["pointerdown", "keydown", "scroll"] as const;
    const activate = () => { cleanup(); setReady(true); };
    const schedule = () => {
      timerId = setTimeout(() => {
        if ("requestIdleCallback" in window) {
          idleId = window.requestIdleCallback(activate, { timeout: 1500 });
        } else { activate(); }
      }, 2000);
    };
    const cleanup = () => {
      window.removeEventListener("load", schedule);
      events.forEach(event => window.removeEventListener(event, activate));
      if (timerId !== undefined) clearTimeout(timerId);
      if (idleId !== undefined) window.cancelIdleCallback(idleId);
    };
    events.forEach(event => window.addEventListener(event, activate, { passive: true, once: true }));
    if (document.readyState === "complete") schedule();
    else window.addEventListener("load", schedule, { once: true });
    return cleanup;
  }, [hidden, ready]);

  if (hidden || !ready) return null;
  return <><SocialContact /><StorefrontChat /></>;
}
