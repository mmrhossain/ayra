import CartList from "@/features/cart/components/CartList";
import { redirectStaffFromShopping } from "@/lib/api/auth/server";

export const metadata = {
  title: "Shopping Cart",
  robots: { index: false, follow: true },
};

const CartPage = async () => {
  await redirectStaffFromShopping();

  return (
    <>
      <CartList />
    </>
  );
};

export default CartPage;
