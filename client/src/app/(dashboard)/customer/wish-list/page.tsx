import { WishlistGrid } from "@/features/dashboard/customer/wishlist/components/wishlist-grid";
import { requireCustomer } from "@/lib/api/auth/server";

export default async function CustomerWishlistPage() {
  await requireCustomer();
  return <WishlistGrid />;
}
