import {Product} from "@/types/product";


export interface Category {
    id: number;
    parent_id: string | null;
    name: string;
    slug: string;
    description: string | null;
    cat_image: string;
    status: string;
    parent: ParentCategory | null;
    all_children: Category[];
    products: Product[];
    products_with_images: ProductWithImages[];
}

export interface ParentCategory {
    id: number;
    parent_id: string | null;
    name: string;
    slug: string;
    description: string | null;
    status: string;
}


export interface ProductWithImages extends Omit<Product, "images"> {
    images: ProductImage[];
}

export interface ProductImage {
    id: number;
    product_id: string;
    image_path: string;
    created_at: string;
    updated_at: string;
}


export interface CategoryState {
    categories: Category[] | null;
    getCategories: () => Promise<void>;
}

