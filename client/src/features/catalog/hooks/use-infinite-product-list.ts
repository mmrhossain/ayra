import { useCallback, useEffect, useRef, useState } from "react";
import { toCatalogErrorMessage } from "@/features/catalog/api";

type CursorPage<T> = {
  items: T[];
  nextCursor?: string | null;
};

export function useInfiniteProductList<T extends { id: string }>({
  initialItems,
  initialCursor,
  loadPage,
  enabled = true,
}: {
  initialItems: T[];
  initialCursor: string | null;
  loadPage: (cursor: string) => Promise<CursorPage<T>>;
  enabled?: boolean;
}) {
  const [items, setItems] = useState(initialItems);
  const [cursor, setCursor] = useState(initialCursor);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);

  const loadMore = useCallback(async () => {
    if (!cursor || loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    setError(null);
    try {
      const page = await loadPage(cursor);
      setItems((current) => {
        const existingIds = new Set(current.map((item) => item.id));
        const newItems = page.items.filter((item) => {
          if (existingIds.has(item.id)) return false;
          existingIds.add(item.id);
          return true;
        });
        return [...current, ...newItems];
      });
      setCursor(page.nextCursor ?? null);
    } catch (loadError) {
      setError(toCatalogErrorMessage(loadError));
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [cursor, loadPage]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!enabled || !sentinel || !cursor || loading || error) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          void loadMore();
        }
      },
      { rootMargin: "400px 0px" }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [cursor, enabled, error, loading, loadMore]);

  return { items, cursor, loading, error, sentinelRef, loadMore };
}
