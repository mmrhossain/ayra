import {
  fetchMyOrder,
  fetchMyOrders,
} from "@/features/dashboard/customer/orders/api/orders";
import { placeOrder } from "@/features/checkout/api";
import { Order, OrderState } from "@/types/order";
import { create } from "zustand";

export const useOrderStore = create<OrderState>((set, get) => ({
  loading: false,

  setLoading: (value: boolean) => {
    set({ loading: value });
  },

  orders: null,
  currentOrder: null,

  createOrder: async (data: Order) => {
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
        ...(data.postal_code ? { postalCode: data.postal_code } : {}),
        addressLine1: data.address,
      };

      const res = await placeOrder({
        paymentMethod: data.paymentMethod,
        billingAddress: address,
        shippingAddress: address,
        shippingMethodCode: data.shippingMethodCode,
        ...(data.couponCode ? { couponCode: data.couponCode } : {}),
      });

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
