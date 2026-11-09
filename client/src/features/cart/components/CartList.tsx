"use client";

import EmptyState from "@/components/shared/EmptyState";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import PageBreadcrumb from "@/components/shared/page-breadcrumb";
import { toCartErrorMessage } from "@/features/cart/api";
import CartItemRow from "@/features/cart/components/CartItemRow";
import Subtotal from "@/features/cart/components/Subtotal";
import CartListSkeleton from "@/features/cart/skeleton/CartListSkeleton";
import { CartItem } from "@/features/cart/types";
import { errorToast, successToast } from "@/helpers";
import { useCartStore } from "@/stores/useCartStore";
import { useEffect, useState } from "react";

const CartList = () => {
  const { cart, cartCount, cartLoading, setCartLoading, removeFromCart, updateCart, fetchCart } =
    useCartStore();

  const [pendingRemove, setPendingRemove] = useState<CartItem | null>(null);
  const [removing, setRemoving] = useState(false);

  useEffect(() => {
    void fetchCart();
  }, [fetchCart]);

  const handleCartRemove = async () => {
    if (!pendingRemove) return;
    try {
      setRemoving(true);
      await removeFromCart(pendingRemove.variantId);
      setPendingRemove(null);
    } catch (err) {
      errorToast(toCartErrorMessage(err));
    } finally {
      setRemoving(false);
    }
  };

  const handleCartUpdate = async (variantId: string, quantity: number) => {
    if (quantity < 1) return;
    try {
      setCartLoading(variantId, true);
      const result = await updateCart(variantId, quantity);
      if (result?.message) successToast(result.message);
    } catch (err) {
      errorToast(toCartErrorMessage(err));
    } finally {
      setCartLoading(variantId, false);
    }
  };

  if (!cart) return <CartListSkeleton />;
  if (cartCount === 0) return <EmptyState text="cart" />;

  return (
    <section className="container mx-auto min-w-0 max-w-6xl py-5 pb-[calc(6rem+env(safe-area-inset-bottom,0px))] sm:py-7 md:py-10 xl:max-w-7xl">
      <PageBreadcrumb
        className="mb-4 sm:mb-5 md:mb-6"
        items={[{ label: "Home", href: "/" }, { label: "Cart" }]}
      />

      <h1 className="mb-5 text-2xl leading-tight font-semibold tracking-tight text-foreground uppercase sm:mb-6 sm:text-2xl md:mb-8">
        Your Cart
      </h1>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1.55fr)_minmax(300px,0.9fr)] lg:items-start lg:gap-5 xl:gap-6 2xl:gap-8">
        <div className="rounded-md border border-border-color px-4 sm:px-5 md:px-6">
          {cart.map((item: CartItem, index: number) => (
            <CartItemRow
              key={item.variantId}
              item={item}
              loading={cartLoading[item.variantId]}
              className={index !== cart.length - 1 ? "border-b border-border-color" : undefined}
              onRemove={() => setPendingRemove(item)}
              onDecrease={() => void handleCartUpdate(item.variantId, Number(item.quantity) - 1)}
              onIncrease={() => void handleCartUpdate(item.variantId, Number(item.quantity) + 1)}
            />
          ))}
        </div>
        <Subtotal />
      </div>

      <ConfirmDialog
        open={Boolean(pendingRemove)}
        onOpenChange={(open) => {
          if (!open) setPendingRemove(null);
        }}
        title="Remove item from cart"
        description={
          pendingRemove
            ? `Remove ${pendingRemove.productName || "this item"} from your cart?`
            : undefined
        }
        confirmLabel="Remove"
        pendingLabel="Removing..."
        pending={removing}
        destructive
        onConfirm={() => void handleCartRemove()}
      />
    </section>
  );
};

export default CartList;
