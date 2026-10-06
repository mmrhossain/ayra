import { WishlistGrid } from "@/features/dashboard/customer/wishlist/components/wishlist-grid";
import {
  fetchWishlistItems,
  toWishlistErrorMessage,
} from "@/features/dashboard/customer/wishlist/api/wishlist";

export const dynamic = "force-dynamic";

export default async function CustomerWishlistPage() {
  let initial;
  let error: string | null = null;

  try {
    initial = await fetchWishlistItems({ page: 1, limit: 50 });
  } catch (err) {
    error = toWishlistErrorMessage(err);
  }

  if (error || !initial) {
    return (
      <div
        role="alert"
        className="rounded-xl border border-destructive/30 bg-destructive/5 p-6"
      >
        <h2 className="text-lg font-semibold">Could not load wishlist</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {error ?? "Unknown error"}
        </p>
      </div>
    );
  }

  return <WishlistGrid initialData={initial} />;
}
