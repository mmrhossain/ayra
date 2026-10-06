import {CartItem} from "@/types/cart";
import {WishItem} from "@/types/wish";

export type Options = {
    withCredentials?: boolean;
    params?: Record<string, string | number | boolean | null | undefined>;
    headers?: Record<string, string>;
    cache?: "no-store" | "force-cache";
    next?: { revalidate: number };
    credentials?: "include";
};




export interface ApiResponse<T> {
    wishList?: WishItem;
    cart?: CartItem;
    message: string;
    success?: boolean;
    data?: T; // present on success
    errors?: Record<string, string[]>; // validation errors
}
