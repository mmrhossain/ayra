"use client";

import { useSyncExternalStore } from "react";

// Keep the sidebar drawer active on tablets as well as phones.
const MOBILE_BREAKPOINT = 1024;
const QUERY = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`;

// 1. Subscribe to window matchMedia changes
const subscribe = (callback: () => void) => {
  if (typeof window === "undefined") return () => {};

  const mql = window.matchMedia(QUERY);
  mql.addEventListener("change", callback);
  return () => mql.removeEventListener("change", callback);
};

// 2. Client snapshot: Read directly from the browser DOM
const getSnapshot = () => {
  return window.matchMedia(QUERY).matches;
};

// 3. Server snapshot: Consistent fallback during SSR / Hydration
const getServerSnapshot = () => {
  return false;
};

export function useIsMobile(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
