import { create } from "zustand";
import {Category, CategoryState} from "@/types/category";
import { fetchCategoryList } from "@/features/catalog/categories-api";


export const useCategoryStore = create<CategoryState>((set) => ({

    categories: null,

    getCategories: async () => {
        try {
            const data = await fetchCategoryList();
            set({categories: data as unknown as Category[]})
        } catch (error: unknown) {
            console.warn("Failed to load categories. Falling back to coming-soon placeholder.", error);
        }
    }

}));
