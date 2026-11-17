// Share concurrent browser reads only. Settled results are never cached, and
// server requests are kept separate so user data cannot cross request boundaries.
export function createSharedRequest<T>(request: () => Promise<T>) {
  let pending: Promise<T> | undefined;
  return {
    read(): Promise<T> {
      if (typeof window === "undefined") return request();
      if (!pending) {
        const current = Promise.resolve().then(request);
        pending = current;
        const release = () => { if (pending === current) pending = undefined; };
        void current.then(release, release);
      }
      return pending;
    },
    invalidate() { pending = undefined; },
  };
}
