import { CustomerOrder } from "@/features/dashboard/customer/orders/types";

export interface Order {
  name: string;
  phone: string;
  email?: string;
  address: string;
  country: string;
  postal_code?: string;
  division: string;
  district: string;
  thana: string;
  couponCode?: string;
  paymentMethod: "COD" | "SSLCOMMERZ";
  shippingMethodCode: string;
}

export type OrderDetails = CustomerOrder;

export interface OrderState {
  loading: boolean;
  setLoading: (loading: boolean) => void;
  orders: OrderDetails[] | null;
  currentOrder: OrderDetails | null;
  createOrder: (
    data: Order,
  ) => Promise<{ message: string; data: CustomerOrder }>;
  fetchOrderList: () => Promise<OrderDetails[]>;
  fetchOrderById: (id: string) => Promise<OrderDetails>;
}
