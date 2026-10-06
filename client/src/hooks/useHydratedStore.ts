import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

export function useHydratedStore<T, F>(
  store: (selector: (state: T) => F) => F,
  selector: (state: T) => F,
  fallback: F
): F {
  const isServer = useSyncExternalStore(
    emptySubscribe,
    () => false, // Client
    () => true // Server (SSR)
  );

  const clientState = store(selector);

  // SSR চলাকালীন Fallback ভ্যালু দিবে, Client-এ এসে Zustand-এর আসল State দিবে
  return isServer ? fallback : clientState;
}
