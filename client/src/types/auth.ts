import { ApiResponse } from "@/types/api";

export interface CustomerAddress {
    id: number;
    user_id: string;
    address: string;
    city: string | null;
    country: string;
    postal_code: string;
    division: string;
    district: string;
    thana: string;
    created_at: string;
    updated_at: string;
}

export interface User {
    id: number;
    name: string;
    email: string;
    phone: string;
    role: string | null;
    status: string;
    created_at: string;
    updated_at: string;
    customer_address: CustomerAddress;
}


export interface Auth {
    id?: number,
    user_id?: number,
    isGuestData?: 1,
    fullName?: string,
    email?: string,
    phone?: string;
    password?: string,
    password_confirmation?: string,
    user?: User
}

export interface AuthState {

    loading: boolean,
    setLoading: (loading: boolean) => void;

    user: Auth | null,
    isLogin: () => boolean,

    setUser: (user: Auth | null) => void,

    login: (data: Pick<Auth, "email" | "phone" | "password">) => Promise<ApiResponse<Auth>>,
    signup: (data: Auth) => Promise<ApiResponse<Auth>>,
    logout: () => {message: string},
}
