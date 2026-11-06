import {
  fetchMyOrder,
  fetchMyOrders,
} from "@/features/dashboard/customer/orders/api/orders";
import { placeOrder } from "@/features/checkout/api";
import { PlaceOrderInput, OrderState } from "@/features/checkout/types";
import { create } from "zustand";

export const useOrderStore = create<OrderState>((set, get) => ({
  loading: false,

  setLoading: (value: boolean) => {
    set({ loading: value });
  },

  orders: null,
  currentOrder: null,

  createOrder: async (data: PlaceOrderInput, idempotencyKey: string) => {
    try {
      get().setLoading(true);

      const address = {
        fullName: data.name,
        phone: data.phone,
        ...(data.email ? { email: data.email } : {}),
        country: data.country || "Bangladesh",
        division: data.division,
        district: data.district,
        ...(data.thana ? { thana: data.thana } : {}),
        ...(data.divisionCode ? { divisionCode: data.divisionCode } : {}),
        ...(data.districtCode ? { districtCode: data.districtCode } : {}),
        ...(data.upazilaCode ? { upazilaCode: data.upazilaCode } : {}),
        ...(data.postal_code ? { postalCode: data.postal_code } : {}),
        addressLine1: data.address,
      };

      const res = await placeOrder(
        {
          paymentMethod: data.paymentMethod,
          billingAddress: address,
          shippingAddress: address,
          shippingMethodCode: data.shippingMethodCode,
          ...(data.couponCode ? { couponCode: data.couponCode } : {}),
          ...(data.expectedSubtotal !== undefined
            ? { expectedSubtotal: data.expectedSubtotal }
            : {}),
          ...(data.acceptPriceChange ? { acceptPriceChange: true } : {}),
        },
        idempotencyKey,
      );

      return { message: res.message, data: res.data };
    } catch (err) {
      console.error("Order create failed", err);
      throw err;
    } finally {
      get().setLoading(false);
    }
  },

  fetchOrderList: async () => {
    try {
      get().setLoading(true);
      const res = await fetchMyOrders();
      const items = res.items || [];
      set({ orders: items });
      return items;
    } catch (err) {
      console.error("Order List fetch failed", err);
      throw err;
    } finally {
      get().setLoading(false);
    }
  },

  fetchOrderById: async (id: string) => {
    try {
      get().setLoading(true);
      const order = await fetchMyOrder(id);
      set({ currentOrder: order });
      return order;
    } catch (err) {
      console.error("Order fetch failed", err);
      throw err;
    } finally {
      get().setLoading(false);
    }
  },
}));
