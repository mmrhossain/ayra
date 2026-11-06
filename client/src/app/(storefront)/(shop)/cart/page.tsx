import CartList from "@/features/cart/components/CartList";
import { redirectStaffFromShopping } from "@/lib/api/auth/server";

const CartPage = async () => {
  await redirectStaffFromShopping();

  return (
    <>
      <CartList />
    </>
  );
};

export default CartPage;
