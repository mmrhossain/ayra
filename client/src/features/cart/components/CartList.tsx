"use client";

import EmptyState from "@/components/shared/EmptyState";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import PageBreadcrumb from "@/components/shared/page-breadcrumb";
import { toCartErrorMessage } from "@/features/cart/api";
import CartItemRow from "@/features/cart/components/CartItemRow";
import Subtotal from "@/features/cart/components/Subtotal";
import CartListSkeleton from "@/features/cart/skeleton/CartListSkeleton";
import { CartItem } from "@/features/cart/types";
import { errorToast, successToast } from "@/helpers";
import { useStorefrontCountQuery } from "@/hooks/useStorefrontCounts";
import { useCartStore } from "@/stores/useCartStore";
import { useState } from "react";

const CartList = () => {
  const { cart, cartCount, cartLoading, setCartLoading, removeFromCart, updateCart } =
    useCartStore();
  const { query: cartQuery, ownerReady } = useStorefrontCountQuery("cart");

  const [pendingRemove, setPendingRemove] = useState<CartItem | null>(null);
  const [removing, setRemoving] = useState(false);

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

  if (!ownerReady) return <CartListSkeleton />;
  if (!cart && cartQuery.isError) {
    return (
      <div className="container storefront-page-start space-y-3 text-center">
        <p role="alert">{toCartErrorMessage(cartQuery.error)}</p>
        <Button type="button" onClick={() => void cartQuery.refetch()}>Try again</Button>
      </div>
    );
  }
  if (!cart) return <CartListSkeleton />;
  if (cartCount === 0) return (
    <EmptyState
      title="Your cart is empty"
      description="Discover our curated heritage collection and fill your cart with pieces you'll cherish forever."
      actionLabel="Continue Shopping"
      actionHref="/shop"
      footerText="Handcrafted with heritage"
    />
  );

  return (
    <section className="container storefront-page-start mx-auto min-w-0 max-w-6xl xl:max-w-7xl 2xl:max-w-[88rem]">
      <PageBreadcrumb
        className="mb-3 sm:mb-4"
        items={[{ label: "Home", href: "/" }, { label: "Cart" }]}
      />

      <h1 className="mb-5 text-2xl leading-tight font-semibold tracking-tight text-foreground uppercase md:mb-6">
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
