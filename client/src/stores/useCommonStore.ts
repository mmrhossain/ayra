import { create } from "zustand";



interface CommonState {
    loading: boolean;
    setLoading: (value: boolean) => void;
}

export const useCommonStore = create<CommonState>((set) => ({

    loading: true,

    setLoading: (value: boolean) => {
        set({ loading: value });
    }


}));