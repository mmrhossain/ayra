export type paths = {
    "/api/v1/auth/register/vendor": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Register a vendor account
         * @description Public. Creates a vendor account via Better Auth (email + password, mandatory email verification) and provisions the vendor profile in a pending-approval state.
         */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        /** Format: email */
                        email: string;
                        password: string;
                        name: string;
                        firstName?: string;
                        lastName?: string;
                        phone?: string;
                        shopName: string;
                        shopSlug: string;
                        description?: string;
                        address?: string;
                    };
                };
            };
            responses: {
                /** @description Vendor registration submitted for approval */
                201: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @enum {boolean} */
                            success: true;
                            message: string;
                            data: {
                                userId: string;
                                profile: {
                                    id: string;
                                    shopName: string;
                                    shopSlug: string;
                                } & {
                                    [key: string]: unknown;
                                };
                            };
                        };
                    };
                };
                /** @description Validation failed or malformed request */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Authentication required */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Forbidden - insufficient role */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Resource not found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Conflict - duplicate value or invalid state */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Too many requests */
                429: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/auth/vendors/pending": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * List pending vendor approvals
         * @description Admin only. Returns vendors awaiting admin approval.
         */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description List of pending vendors */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @enum {boolean} */
                            success: true;
                            data: ({
                                id: string;
                                email: string;
                                role: string;
                                isApproved: boolean;
                                vendorProfile?: ({
                                    id: string;
                                    shopName: string;
                                    shopSlug: string;
                                } & {
                                    [key: string]: unknown;
                                }) | null;
                            } & {
                                [key: string]: unknown;
                            })[];
                        };
                    };
                };
                /** @description Validation failed or malformed request */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Authentication required */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Forbidden - insufficient role */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Resource not found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Conflict - duplicate value or invalid state */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Too many requests */
                429: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/auth/vendors/{userId}/approve": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Approve a vendor
         * @description Admin only. Approves a pending vendor account.
         */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    userId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Vendor approved */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @enum {boolean} */
                            success: true;
                            message: string;
                            data: {
                                userId: string;
                                approved?: boolean;
                                rejected?: boolean;
                            };
                        };
                    };
                };
                /** @description Validation failed or malformed request */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Authentication required */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Forbidden - insufficient role */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Resource not found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Conflict - duplicate value or invalid state */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Too many requests */
                429: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/auth/vendors/{userId}/reject": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Reject a vendor
         * @description Admin only. Rejects and deletes a pending vendor account.
         */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    userId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Vendor rejected */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @enum {boolean} */
                            success: true;
                            message: string;
                            data: {
                                userId: string;
                                approved?: boolean;
                                rejected?: boolean;
                            };
                        };
                    };
                };
                /** @description Validation failed or malformed request */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Authentication required */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Forbidden - insufficient role */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Resource not found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Conflict - duplicate value or invalid state */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Too many requests */
                429: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/products": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * List products
         * @description Public. Paginated product listing with filtering and sorting.
         */
        get: {
            parameters: {
                query?: {
                    q?: string;
                    category?: string;
                    brand?: string;
                    minPrice?: number | null;
                    maxPrice?: number | null;
                    inStock?: boolean | null;
                    featured?: boolean | null;
                    sort?: "newest" | "price_asc" | "price_desc" | "name_asc" | "name_desc" | "featured";
                    page?: number;
                    limit?: number;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Paginated product list */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @enum {boolean} */
                            success: true;
                            data: {
                                items: ({
                                    id: string;
                                    name: string;
                                    slug: string;
                                    shortDescription?: string | null;
                                    isFeatured: boolean;
                                    category?: {
                                        id: string;
                                        name: string;
                                        slug: string;
                                    } | null;
                                    brand?: {
                                        id: string;
                                        name: string;
                                        slug: string;
                                    } | null;
                                    images: {
                                        id: string;
                                        imageUrl: string;
                                        altText?: string | null;
                                        isPrimary: boolean;
                                        sortOrder?: number | null;
                                    }[];
                                    priceRange: {
                                        min: number;
                                        max: number;
                                    };
                                    availableStock: number;
                                    createdAt: string;
                                } & {
                                    [key: string]: unknown;
                                })[];
                                pagination: components["schemas"]["PaginationMeta"];
                            };
                        };
                    };
                };
                /** @description Validation failed or malformed request */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Authentication required */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Forbidden - insufficient role */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Resource not found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Conflict - duplicate value or invalid state */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Too many requests */
                429: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        put?: never;
        /**
         * Create a product
         * @description Admin only.
         */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        name: string;
                        slug?: string;
                        shortDescription?: string | null;
                        description?: string | null;
                        sku?: string | null;
                        isPublished?: boolean;
                        isFeatured?: boolean;
                        metaTitle?: string | null;
                        metaDescription?: string | null;
                        /** Format: uuid */
                        categoryId: string;
                        /** Format: uuid */
                        brandId?: string | null;
                        images?: {
                            /** Format: uri */
                            imageUrl: string;
                            altText?: string | null;
                            isPrimary?: boolean;
                            sortOrder?: number | null;
                        }[];
                        variants: {
                            sku: string;
                            barcode?: string | null;
                            price: number | null;
                            compareAtPrice?: number | null;
                            costPrice?: number | null;
                            weight?: number | null;
                            isDefault?: boolean;
                            lowStockThreshold?: number | null;
                            attributes?: {
                                name: string;
                                value: string;
                            }[];
                            inventory?: {
                                /** Format: uuid */
                                warehouseId: string;
                                quantityOnHand: number | null;
                            }[];
                        }[];
                    };
                };
            };
            responses: {
                /** @description Product created */
                201: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @enum {boolean} */
                            success: true;
                            data: {
                                id: string;
                                name: string;
                                slug: string;
                                shortDescription?: string | null;
                                isFeatured: boolean;
                                category?: {
                                    id: string;
                                    name: string;
                                    slug: string;
                                } | null;
                                brand?: {
                                    id: string;
                                    name: string;
                                    slug: string;
                                } | null;
                                images: {
                                    id: string;
                                    imageUrl: string;
                                    altText?: string | null;
                                    isPrimary: boolean;
                                    sortOrder?: number | null;
                                }[];
                                priceRange: {
                                    min: number;
                                    max: number;
                                };
                                availableStock: number;
                                createdAt: string;
                                description?: string | null;
                                sku?: string | null;
                                metaTitle?: string | null;
                                metaDescription?: string | null;
                                variants?: ({
                                    id: string;
                                    sku: string;
                                    price: number;
                                    compareAtPrice?: number | null;
                                    weight?: number | null;
                                    isDefault: boolean;
                                    lowStockThreshold: number;
                                    availableStock: number;
                                    attributes?: {
                                        name: string;
                                        value: string;
                                    }[];
                                } & {
                                    [key: string]: unknown;
                                })[];
                            } & {
                                [key: string]: unknown;
                            };
                        };
                    };
                };
                /** @description Validation failed or malformed request */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Authentication required */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Forbidden - insufficient role */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Resource not found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Conflict - duplicate value or invalid state */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Too many requests */
                429: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/products/{slug}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get a product by slug
         * @description Public. Returns a published product with its variants and aggregated stock. Internal fields (cost price, per-warehouse stock) are excluded.
         */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    slug: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Product detail */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @enum {boolean} */
                            success: true;
                            data: {
                                id: string;
                                name: string;
                                slug: string;
                                shortDescription?: string | null;
                                isFeatured: boolean;
                                category?: {
                                    id: string;
                                    name: string;
                                    slug: string;
                                } | null;
                                brand?: {
                                    id: string;
                                    name: string;
                                    slug: string;
                                } | null;
                                images: {
                                    id: string;
                                    imageUrl: string;
                                    altText?: string | null;
                                    isPrimary: boolean;
                                    sortOrder?: number | null;
                                }[];
                                priceRange: {
                                    min: number;
                                    max: number;
                                };
                                availableStock: number;
                                createdAt: string;
                                description?: string | null;
                                sku?: string | null;
                                metaTitle?: string | null;
                                metaDescription?: string | null;
                                variants?: ({
                                    id: string;
                                    sku: string;
                                    price: number;
                                    compareAtPrice?: number | null;
                                    weight?: number | null;
                                    isDefault: boolean;
                                    lowStockThreshold: number;
                                    availableStock: number;
                                    attributes?: {
                                        name: string;
                                        value: string;
                                    }[];
                                } & {
                                    [key: string]: unknown;
                                })[];
                            } & {
                                [key: string]: unknown;
                            };
                        };
                    };
                };
                /** @description Validation failed or malformed request */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Authentication required */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Forbidden - insufficient role */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Resource not found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Conflict - duplicate value or invalid state */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Too many requests */
                429: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/products/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /**
         * Delete a product
         * @description Admin only. Soft-deletes the product.
         */
        delete: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Product deleted */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @enum {boolean} */
                            success: true;
                            data: {
                                id: string;
                                /** @enum {boolean} */
                                deleted: true;
                            };
                        };
                    };
                };
                /** @description Validation failed or malformed request */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Authentication required */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Forbidden - insufficient role */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Resource not found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Conflict - duplicate value or invalid state */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Too many requests */
                429: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        options?: never;
        head?: never;
        /**
         * Update a product
         * @description Admin only.
         */
        patch: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: string;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        name?: string;
                        slug?: string;
                        shortDescription?: string | null;
                        description?: string | null;
                        sku?: string | null;
                        isPublished?: boolean;
                        isFeatured?: boolean;
                        metaTitle?: string | null;
                        metaDescription?: string | null;
                        /** Format: uuid */
                        categoryId?: string;
                        /** Format: uuid */
                        brandId?: string | null;
                        images?: {
                            /** Format: uri */
                            imageUrl: string;
                            altText?: string | null;
                            isPrimary?: boolean;
                            sortOrder?: number | null;
                        }[];
                    };
                };
            };
            responses: {
                /** @description Product updated */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @enum {boolean} */
                            success: true;
                            data: {
                                id: string;
                                name: string;
                                slug: string;
                                shortDescription?: string | null;
                                isFeatured: boolean;
                                category?: {
                                    id: string;
                                    name: string;
                                    slug: string;
                                } | null;
                                brand?: {
                                    id: string;
                                    name: string;
                                    slug: string;
                                } | null;
                                images: {
                                    id: string;
                                    imageUrl: string;
                                    altText?: string | null;
                                    isPrimary: boolean;
                                    sortOrder?: number | null;
                                }[];
                                priceRange: {
                                    min: number;
                                    max: number;
                                };
                                availableStock: number;
                                createdAt: string;
                                description?: string | null;
                                sku?: string | null;
                                metaTitle?: string | null;
                                metaDescription?: string | null;
                                variants?: ({
                                    id: string;
                                    sku: string;
                                    price: number;
                                    compareAtPrice?: number | null;
                                    weight?: number | null;
                                    isDefault: boolean;
                                    lowStockThreshold: number;
                                    availableStock: number;
                                    attributes?: {
                                        name: string;
                                        value: string;
                                    }[];
                                } & {
                                    [key: string]: unknown;
                                })[];
                            } & {
                                [key: string]: unknown;
                            };
                        };
                    };
                };
                /** @description Validation failed or malformed request */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Authentication required */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Forbidden - insufficient role */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Resource not found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Conflict - duplicate value or invalid state */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Too many requests */
                429: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        trace?: never;
    };
    "/api/v1/products/{id}/variants": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Add a product variant
         * @description Admin only.
         */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: string;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        sku: string;
                        barcode?: string | null;
                        price: number | null;
                        compareAtPrice?: number | null;
                        costPrice?: number | null;
                        weight?: number | null;
                        isDefault?: boolean;
                        lowStockThreshold?: number | null;
                        attributes?: {
                            name: string;
                            value: string;
                        }[];
                        inventory?: {
                            /** Format: uuid */
                            warehouseId: string;
                            quantityOnHand: number | null;
                        }[];
                    };
                };
            };
            responses: {
                /** @description Variant added */
                201: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @enum {boolean} */
                            success: true;
                            data: {
                                id: string;
                                sku: string;
                                price: number;
                                attributes?: {
                                    name: string;
                                    value: string;
                                }[];
                            } & {
                                [key: string]: unknown;
                            };
                        };
                    };
                };
                /** @description Validation failed or malformed request */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Authentication required */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Forbidden - insufficient role */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Resource not found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Conflict - duplicate value or invalid state */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Too many requests */
                429: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/products/{id}/variants/{variantId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /**
         * Delete a product variant
         * @description Admin only. Soft-deletes the variant.
         */
        delete: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: string;
                    variantId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Variant deleted */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @enum {boolean} */
                            success: true;
                            data: {
                                id: string;
                                /** @enum {boolean} */
                                deleted: true;
                            };
                        };
                    };
                };
                /** @description Validation failed or malformed request */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Authentication required */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Forbidden - insufficient role */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Resource not found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Conflict - duplicate value or invalid state */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Too many requests */
                429: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        options?: never;
        head?: never;
        /**
         * Update a product variant
         * @description Admin only.
         */
        patch: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: string;
                    variantId: string;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        sku?: string;
                        barcode?: string | null;
                        price?: number | null;
                        compareAtPrice?: number | null;
                        costPrice?: number | null;
                        weight?: number | null;
                        isDefault?: boolean;
                        lowStockThreshold?: number | null;
                        attributes?: {
                            name: string;
                            value: string;
                        }[];
                        inventory?: {
                            /** Format: uuid */
                            warehouseId: string;
                            quantityOnHand: number | null;
                        }[];
                    };
                };
            };
            responses: {
                /** @description Variant updated */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @enum {boolean} */
                            success: true;
                            data: {
                                id: string;
                                sku: string;
                                price: number;
                                attributes?: {
                                    name: string;
                                    value: string;
                                }[];
                            } & {
                                [key: string]: unknown;
                            };
                        };
                    };
                };
                /** @description Validation failed or malformed request */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Authentication required */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Forbidden - insufficient role */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Resource not found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Conflict - duplicate value or invalid state */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Too many requests */
                429: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        trace?: never;
    };
    "/api/v1/products/{id}/images": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /**
         * Replace product images
         * @description Admin only. Replaces the full image set for a product.
         */
        put: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: string;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        images: {
                            /** Format: uri */
                            imageUrl: string;
                            altText?: string | null;
                            isPrimary?: boolean;
                            sortOrder?: number | null;
                        }[];
                    };
                };
            };
            responses: {
                /** @description Images replaced */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @enum {boolean} */
                            success: true;
                            data: ({
                                id: string;
                                imageUrl: string;
                                isPrimary: boolean;
                                sortOrder: number;
                            } & {
                                [key: string]: unknown;
                            })[];
                        };
                    };
                };
                /** @description Validation failed or malformed request */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Authentication required */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Forbidden - insufficient role */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Resource not found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Conflict - duplicate value or invalid state */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Too many requests */
                429: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/categories": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * List category tree
         * @description Public. Returns the active categories as a nested tree.
         */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Category tree */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @enum {boolean} */
                            success: true;
                            data: ({
                                id: string;
                                name: string;
                                slug: string;
                                description?: string | null;
                                image?: string | null;
                                productCount: number;
                                children: {
                                    [key: string]: unknown;
                                }[];
                            } & {
                                [key: string]: unknown;
                            })[];
                        };
                    };
                };
                /** @description Validation failed or malformed request */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Authentication required */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Forbidden - insufficient role */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Resource not found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Conflict - duplicate value or invalid state */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Too many requests */
                429: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        put?: never;
        /**
         * Create a category
         * @description Admin only.
         */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        name: string;
                        slug?: string;
                        description?: string | null;
                        /** Format: uri */
                        image?: string | null;
                        isActive?: boolean;
                        /** Format: uuid */
                        parentId?: string | null;
                    };
                };
            };
            responses: {
                /** @description Category created */
                201: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @enum {boolean} */
                            success: true;
                            data: {
                                id: string;
                                name: string;
                                slug: string;
                                isActive: boolean;
                            } & {
                                [key: string]: unknown;
                            };
                        };
                    };
                };
                /** @description Validation failed or malformed request */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Authentication required */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Forbidden - insufficient role */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Resource not found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Conflict - duplicate value or invalid state */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Too many requests */
                429: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/categories/{slug}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get a category by slug
         * @description Public.
         */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    slug: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Category detail */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @enum {boolean} */
                            success: true;
                            data: {
                                id: string;
                                name: string;
                                slug: string;
                                parent?: {
                                    [key: string]: unknown;
                                } | null;
                                children?: {
                                    [key: string]: unknown;
                                }[];
                                _count?: {
                                    products: number;
                                };
                            } & {
                                [key: string]: unknown;
                            };
                        };
                    };
                };
                /** @description Validation failed or malformed request */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Authentication required */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Forbidden - insufficient role */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Resource not found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Conflict - duplicate value or invalid state */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Too many requests */
                429: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/categories/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /**
         * Delete a category
         * @description Admin only. Soft-deletes the category.
         */
        delete: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Category deleted */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @enum {boolean} */
                            success: true;
                            data: {
                                id: string;
                                /** @enum {boolean} */
                                deleted: true;
                            };
                        };
                    };
                };
                /** @description Validation failed or malformed request */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Authentication required */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Forbidden - insufficient role */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Resource not found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Conflict - duplicate value or invalid state */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Too many requests */
                429: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        options?: never;
        head?: never;
        /**
         * Update a category
         * @description Admin only.
         */
        patch: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: string;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        name?: string;
                        slug?: string;
                        description?: string | null;
                        /** Format: uri */
                        image?: string | null;
                        isActive?: boolean;
                        /** Format: uuid */
                        parentId?: string | null;
                    };
                };
            };
            responses: {
                /** @description Category updated */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @enum {boolean} */
                            success: true;
                            data: {
                                id: string;
                                name: string;
                                slug: string;
                                isActive: boolean;
                            } & {
                                [key: string]: unknown;
                            };
                        };
                    };
                };
                /** @description Validation failed or malformed request */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Authentication required */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Forbidden - insufficient role */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Resource not found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Conflict - duplicate value or invalid state */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Too many requests */
                429: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        trace?: never;
    };
    "/api/v1/inventory/warehouses": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * List warehouses
         * @description Admin only.
         */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description List of warehouses */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @enum {boolean} */
                            success: true;
                            data: ({
                                id: string;
                                name: string;
                                code: string;
                                isActive: boolean;
                            } & {
                                [key: string]: unknown;
                            })[];
                        };
                    };
                };
                /** @description Validation failed or malformed request */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Authentication required */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Forbidden - insufficient role */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Resource not found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Conflict - duplicate value or invalid state */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Too many requests */
                429: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        put?: never;
        /**
         * Create a warehouse
         * @description Admin only.
         */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        name: string;
                        code: string;
                        phone?: string | null;
                        /** Format: email */
                        email?: string | null;
                        country: string;
                        state?: string | null;
                        city: string;
                        addressLine1: string;
                        addressLine2?: string | null;
                        isActive?: boolean;
                    };
                };
            };
            responses: {
                /** @description Warehouse created */
                201: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @enum {boolean} */
                            success: true;
                            data: {
                                id: string;
                                name: string;
                                code: string;
                                isActive: boolean;
                            } & {
                                [key: string]: unknown;
                            };
                        };
                    };
                };
                /** @description Validation failed or malformed request */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Authentication required */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Forbidden - insufficient role */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Resource not found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Conflict - duplicate value or invalid state */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Too many requests */
                429: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/inventory/stock-in": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Stock in
         * @description Admin only. Increases quantity on hand for a variant+warehouse.
         */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        /** Format: uuid */
                        variantId: string;
                        /** Format: uuid */
                        warehouseId: string;
                        quantity: number;
                        referenceType?: string | null;
                        referenceId?: string | null;
                        remarks?: string | null;
                    };
                };
            };
            responses: {
                /** @description Stock-in movement recorded */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @enum {boolean} */
                            success: true;
                            data: {
                                id: string;
                                variantId: string;
                                warehouseId: string;
                                quantity: number;
                                type: string;
                            } & {
                                [key: string]: unknown;
                            };
                        };
                    };
                };
                /** @description Validation failed or malformed request */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Authentication required */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Forbidden - insufficient role */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Resource not found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Conflict - duplicate value or invalid state */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Too many requests */
                429: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/inventory/stock-out": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Stock out
         * @description Admin only. Decreases quantity on hand; rejects if it would go negative.
         */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        /** Format: uuid */
                        variantId: string;
                        /** Format: uuid */
                        warehouseId: string;
                        quantity: number;
                        referenceType?: string | null;
                        referenceId?: string | null;
                        remarks?: string | null;
                    };
                };
            };
            responses: {
                /** @description Stock-out movement recorded */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @enum {boolean} */
                            success: true;
                            data: {
                                id: string;
                                variantId: string;
                                warehouseId: string;
                                quantity: number;
                                type: string;
                            } & {
                                [key: string]: unknown;
                            };
                        };
                    };
                };
                /** @description Validation failed or malformed request */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Authentication required */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Forbidden - insufficient role */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Resource not found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Conflict - duplicate value or invalid state */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Too many requests */
                429: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/inventory/adjust": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Adjust stock
         * @description Admin only. Applies a signed quantity adjustment with a required reason.
         */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        /** Format: uuid */
                        variantId: string;
                        /** Format: uuid */
                        warehouseId: string;
                        quantity: number;
                        reason: string;
                    };
                };
            };
            responses: {
                /** @description Stock adjusted */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @enum {boolean} */
                            success: true;
                            data: {
                                id: string;
                                variantId: string;
                                warehouseId: string;
                                quantity: number;
                                type: string;
                            } & {
                                [key: string]: unknown;
                            };
                        };
                    };
                };
                /** @description Validation failed or malformed request */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Authentication required */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Forbidden - insufficient role */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Resource not found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Conflict - duplicate value or invalid state */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Too many requests */
                429: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/inventory/set": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Set stock level
         * @description Admin only. Sets the quantity on hand to an absolute value.
         */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        /** Format: uuid */
                        variantId: string;
                        /** Format: uuid */
                        warehouseId: string;
                        quantityOnHand: number | null;
                        lowStockThreshold?: number | null;
                    };
                };
            };
            responses: {
                /** @description Stock level set */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @enum {boolean} */
                            success: true;
                            data: {
                                id: string;
                                variantId: string;
                                warehouseId: string;
                                quantity: number;
                                type: string;
                            } & {
                                [key: string]: unknown;
                            };
                        };
                    };
                };
                /** @description Validation failed or malformed request */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Authentication required */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Forbidden - insufficient role */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Resource not found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Conflict - duplicate value or invalid state */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Too many requests */
                429: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/inventory/low-stock": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * List low-stock items
         * @description Admin only. Paginated list of variants at or below their low-stock threshold.
         */
        get: {
            parameters: {
                query?: {
                    page?: number;
                    limit?: number;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Paginated low-stock list */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @enum {boolean} */
                            success: true;
                            data: {
                                items: ({
                                    variantId: string;
                                    sku: string;
                                    productId: string;
                                    productName: string;
                                    totalOnHand: number;
                                    totalReserved: number;
                                    totalAvailable: number;
                                    lowStockThreshold: number;
                                } & {
                                    [key: string]: unknown;
                                })[];
                                pagination: components["schemas"]["PaginationMeta"];
                            };
                        };
                    };
                };
                /** @description Validation failed or malformed request */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Authentication required */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Forbidden - insufficient role */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Resource not found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Conflict - duplicate value or invalid state */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Too many requests */
                429: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/cart": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get the current cart
         * @description Returns the authenticated user's cart, or the guest cart for the given `x-guest-session-id`.
         */
        get: {
            parameters: {
                query?: never;
                header?: {
                    /** @description Opaque guest session id generated client-side. Required for guest carts. */
                    "x-guest-session-id"?: string;
                };
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Current cart */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @enum {boolean} */
                            success: true;
                            data: {
                                id?: string | null;
                                customerProfileId?: string | null;
                                sessionId?: string | null;
                                items: {
                                    id?: string | null;
                                    variantId: string;
                                    productId: string;
                                    productName: string;
                                    productSlug?: string | null;
                                    productImage?: string | null;
                                    sku: string;
                                    unitPrice: string;
                                    subtotal: string;
                                    quantity: number;
                                    availableStock: number;
                                    attributes: {
                                        name: string;
                                        value: string;
                                    }[];
                                }[];
                                itemCount: number;
                                subtotal: string;
                                discountAmount: string;
                                taxAmount: string;
                                shippingAmount: string;
                                grandTotal: string;
                            };
                        };
                    };
                };
                /** @description Validation failed or malformed request */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Authentication required */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Forbidden - insufficient role */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Resource not found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Conflict - duplicate value or invalid state */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Too many requests */
                429: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        /**
         * Clear the cart
         * @description Empties the current user's cart or the guest cart.
         */
        delete: {
            parameters: {
                query?: never;
                header?: {
                    /** @description Opaque guest session id generated client-side. Required for guest carts. */
                    "x-guest-session-id"?: string;
                };
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Empty cart */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @enum {boolean} */
                            success: true;
                            data: {
                                id?: string | null;
                                customerProfileId?: string | null;
                                sessionId?: string | null;
                                items: {
                                    id?: string | null;
                                    variantId: string;
                                    productId: string;
                                    productName: string;
                                    productSlug?: string | null;
                                    productImage?: string | null;
                                    sku: string;
                                    unitPrice: string;
                                    subtotal: string;
                                    quantity: number;
                                    availableStock: number;
                                    attributes: {
                                        name: string;
                                        value: string;
                                    }[];
                                }[];
                                itemCount: number;
                                subtotal: string;
                                discountAmount: string;
                                taxAmount: string;
                                shippingAmount: string;
                                grandTotal: string;
                            };
                        };
                    };
                };
                /** @description Validation failed or malformed request */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Authentication required */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Forbidden - insufficient role */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Resource not found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Conflict - duplicate value or invalid state */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Too many requests */
                429: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/cart/items": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Add an item to the cart
         * @description Adds a variant to the cart. Quantity is validated against available stock; pricing is always server-side from the product catalog.
         */
        post: {
            parameters: {
                query?: never;
                header?: {
                    /** @description Opaque guest session id generated client-side. Required for guest carts. */
                    "x-guest-session-id"?: string;
                };
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        /** Format: uuid */
                        variantId: string;
                        quantity: number;
                    };
                };
            };
            responses: {
                /** @description Cart after adding the item */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @enum {boolean} */
                            success: true;
                            data: {
                                id?: string | null;
                                customerProfileId?: string | null;
                                sessionId?: string | null;
                                items: {
                                    id?: string | null;
                                    variantId: string;
                                    productId: string;
                                    productName: string;
                                    productSlug?: string | null;
                                    productImage?: string | null;
                                    sku: string;
                                    unitPrice: string;
                                    subtotal: string;
                                    quantity: number;
                                    availableStock: number;
                                    attributes: {
                                        name: string;
                                        value: string;
                                    }[];
                                }[];
                                itemCount: number;
                                subtotal: string;
                                discountAmount: string;
                                taxAmount: string;
                                shippingAmount: string;
                                grandTotal: string;
                            };
                        };
                    };
                };
                /** @description Validation failed or malformed request */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Authentication required */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Forbidden - insufficient role */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Resource not found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Conflict - duplicate value or invalid state */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Too many requests */
                429: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/cart/items/{itemId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /**
         * Remove an item from the cart
         * @description Removes a cart item. Ownership is enforced: the item must belong to the current user's cart.
         */
        delete: {
            parameters: {
                query?: never;
                header?: {
                    /** @description Opaque guest session id generated client-side. Required for guest carts. */
                    "x-guest-session-id"?: string;
                };
                path: {
                    itemId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Cart after removing the item */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @enum {boolean} */
                            success: true;
                            data: {
                                id?: string | null;
                                customerProfileId?: string | null;
                                sessionId?: string | null;
                                items: {
                                    id?: string | null;
                                    variantId: string;
                                    productId: string;
                                    productName: string;
                                    productSlug?: string | null;
                                    productImage?: string | null;
                                    sku: string;
                                    unitPrice: string;
                                    subtotal: string;
                                    quantity: number;
                                    availableStock: number;
                                    attributes: {
                                        name: string;
                                        value: string;
                                    }[];
                                }[];
                                itemCount: number;
                                subtotal: string;
                                discountAmount: string;
                                taxAmount: string;
                                shippingAmount: string;
                                grandTotal: string;
                            };
                        };
                    };
                };
                /** @description Validation failed or malformed request */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Authentication required */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Forbidden - insufficient role */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Resource not found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Conflict - duplicate value or invalid state */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Too many requests */
                429: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        options?: never;
        head?: never;
        /**
         * Update a cart item quantity
         * @description Updates the quantity of a cart item. Ownership is enforced: the item must belong to the current user's cart.
         */
        patch: {
            parameters: {
                query?: never;
                header?: {
                    /** @description Opaque guest session id generated client-side. Required for guest carts. */
                    "x-guest-session-id"?: string;
                };
                path: {
                    itemId: string;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        quantity: number;
                    };
                };
            };
            responses: {
                /** @description Cart after updating the item */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @enum {boolean} */
                            success: true;
                            data: {
                                id?: string | null;
                                customerProfileId?: string | null;
                                sessionId?: string | null;
                                items: {
                                    id?: string | null;
                                    variantId: string;
                                    productId: string;
                                    productName: string;
                                    productSlug?: string | null;
                                    productImage?: string | null;
                                    sku: string;
                                    unitPrice: string;
                                    subtotal: string;
                                    quantity: number;
                                    availableStock: number;
                                    attributes: {
                                        name: string;
                                        value: string;
                                    }[];
                                }[];
                                itemCount: number;
                                subtotal: string;
                                discountAmount: string;
                                taxAmount: string;
                                shippingAmount: string;
                                grandTotal: string;
                            };
                        };
                    };
                };
                /** @description Validation failed or malformed request */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Authentication required */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Forbidden - insufficient role */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Resource not found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Conflict - duplicate value or invalid state */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Too many requests */
                429: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        trace?: never;
    };
    "/api/v1/cart/merge": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Merge guest cart on login
         * @description Authentication required. Merges the guest cart identified by the `x-guest-session-id` into the authenticated user's cart, then clears the guest cart. Quantities are capped at available stock.
         */
        post: {
            parameters: {
                query?: never;
                header?: {
                    /** @description Opaque guest session id generated client-side. Required for guest carts. */
                    "x-guest-session-id"?: string;
                };
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        sessionId: string;
                    };
                };
            };
            responses: {
                /** @description Merged cart */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @enum {boolean} */
                            success: true;
                            data: {
                                id?: string | null;
                                customerProfileId?: string | null;
                                sessionId?: string | null;
                                items: {
                                    id?: string | null;
                                    variantId: string;
                                    productId: string;
                                    productName: string;
                                    productSlug?: string | null;
                                    productImage?: string | null;
                                    sku: string;
                                    unitPrice: string;
                                    subtotal: string;
                                    quantity: number;
                                    availableStock: number;
                                    attributes: {
                                        name: string;
                                        value: string;
                                    }[];
                                }[];
                                itemCount: number;
                                subtotal: string;
                                discountAmount: string;
                                taxAmount: string;
                                shippingAmount: string;
                                grandTotal: string;
                            };
                        };
                    };
                };
                /** @description Validation failed or malformed request */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Authentication required */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Forbidden - insufficient role */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Resource not found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Conflict - duplicate value or invalid state */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Too many requests */
                429: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/checkout": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Place an order from the cart
         * @description Authentication required. Creates the order, reserves stock atomically, and optionally initiates payment. All prices are recalculated server-side from the cart; no client-supplied amounts are trusted.
         */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        /** Format: uuid */
                        shippingAddressId?: string;
                        shippingAddress?: {
                            fullName: string;
                            phone: string;
                            /** Format: email */
                            email?: string | null;
                            country: string;
                            state?: string | null;
                            city: string;
                            area?: string | null;
                            postalCode?: string | null;
                            addressLine1: string;
                            addressLine2?: string | null;
                        };
                        /** Format: uuid */
                        billingAddressId?: string;
                        billingAddress?: {
                            fullName: string;
                            phone: string;
                            /** Format: email */
                            email?: string | null;
                            country: string;
                            state?: string | null;
                            city: string;
                            area?: string | null;
                            postalCode?: string | null;
                            addressLine1: string;
                            addressLine2?: string | null;
                        };
                        /**
                         * @default flat
                         * @enum {string}
                         */
                        shippingMethod?: "flat" | "free";
                        /** @enum {string} */
                        paymentMethod?: "COD" | "SSLCOMMERZ";
                        notes?: string | null;
                    };
                };
            };
            responses: {
                /** @description Order created */
                201: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @enum {boolean} */
                            success: true;
                            data: {
                                orderId: string;
                                orderNumber: string;
                                status: string;
                                paymentStatus: string;
                                currency: string;
                                subtotal: string;
                                discountAmount: string;
                                taxAmount: string;
                                shippingAmount: string;
                                grandTotal: string;
                                shippingMethod: string;
                                items: {
                                    productName: string;
                                    sku: string;
                                    variantId: string;
                                    quantity: number;
                                    unitPrice: string;
                                    subtotal: string;
                                }[];
                                payment?: {
                                    paymentId: string;
                                    redirectUrl?: string | null;
                                    method: string;
                                };
                                paymentError?: string;
                            } & {
                                [key: string]: unknown;
                            };
                        };
                    };
                };
                /** @description Validation failed or malformed request */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Authentication required */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Forbidden - insufficient role */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Resource not found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Conflict - duplicate value or invalid state */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Too many requests */
                429: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/orders": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * List my orders
         * @description Authentication required. Paginated list of the authenticated customer's orders.
         */
        get: {
            parameters: {
                query?: {
                    page?: number;
                    limit?: number;
                    status?: "PENDING" | "CONFIRMED" | "PROCESSING" | "PACKED" | "SHIPPED" | "DELIVERED" | "CANCELLED" | "RETURN_REQUESTED" | "RETURNED" | "REFUNDED" | null;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Paginated order list */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @enum {boolean} */
                            success: true;
                            data: {
                                items: ({
                                    id: string;
                                    orderNumber: string;
                                    status: string;
                                    paymentStatus: string;
                                    fulfillmentStatus: string;
                                    currency: string;
                                    subtotal?: unknown;
                                    discountAmount?: unknown;
                                    taxAmount?: unknown;
                                    shippingAmount?: unknown;
                                    grandTotal?: unknown;
                                    items: ({
                                        id: string;
                                        productName: string;
                                        sku: string;
                                        variantId?: string | null;
                                        quantity: number;
                                        unitPrice?: unknown;
                                        subtotal?: unknown;
                                    } & {
                                        [key: string]: unknown;
                                    })[];
                                } & {
                                    [key: string]: unknown;
                                })[];
                                pagination: components["schemas"]["PaginationMeta"];
                            };
                        };
                    };
                };
                /** @description Validation failed or malformed request */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Authentication required */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Forbidden - insufficient role */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Resource not found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Conflict - duplicate value or invalid state */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Too many requests */
                429: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/orders/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get an order
         * @description Authentication required. Returns the order only if it belongs to the authenticated customer (ownership enforced, otherwise 404).
         */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Order detail */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @enum {boolean} */
                            success: true;
                            data: {
                                id: string;
                                orderNumber: string;
                                status: string;
                                paymentStatus: string;
                                fulfillmentStatus: string;
                                currency: string;
                                subtotal?: unknown;
                                discountAmount?: unknown;
                                taxAmount?: unknown;
                                shippingAmount?: unknown;
                                grandTotal?: unknown;
                                items: ({
                                    id: string;
                                    productName: string;
                                    sku: string;
                                    variantId?: string | null;
                                    quantity: number;
                                    unitPrice?: unknown;
                                    subtotal?: unknown;
                                } & {
                                    [key: string]: unknown;
                                })[];
                            } & {
                                [key: string]: unknown;
                            };
                        };
                    };
                };
                /** @description Validation failed or malformed request */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Authentication required */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Forbidden - insufficient role */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Resource not found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Conflict - duplicate value or invalid state */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Too many requests */
                429: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/orders/{id}/cancel": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Cancel an order
         * @description Authentication required. Cancels the customer's own order within the cancellable statuses and releases reserved stock.
         */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: string;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        reason?: string | null;
                    };
                };
            };
            responses: {
                /** @description Order cancelled */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @enum {boolean} */
                            success: true;
                            message: string;
                            data: {
                                id: string;
                                status: string;
                                paymentStatus: string;
                            } & {
                                [key: string]: unknown;
                            };
                        };
                    };
                };
                /** @description Validation failed or malformed request */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Authentication required */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Forbidden - insufficient role */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Resource not found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Conflict - duplicate value or invalid state */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Too many requests */
                429: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/orders/{id}/return": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Request a return
         * @description Authentication required. Requests a return for the customer's own order.
         */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: string;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        reason?: string | null;
                    };
                };
            };
            responses: {
                /** @description Return requested */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @enum {boolean} */
                            success: true;
                            message: string;
                            data: {
                                id: string;
                                status: string;
                                paymentStatus: string;
                            } & {
                                [key: string]: unknown;
                            };
                        };
                    };
                };
                /** @description Validation failed or malformed request */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Authentication required */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Forbidden - insufficient role */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Resource not found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Conflict - duplicate value or invalid state */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Too many requests */
                429: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/orders/admin": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * List all orders (admin)
         * @description Admin only. Paginated order listing with status / payment status / date filters.
         */
        get: {
            parameters: {
                query?: {
                    page?: number;
                    limit?: number;
                    status?: "PENDING" | "CONFIRMED" | "PROCESSING" | "PACKED" | "SHIPPED" | "DELIVERED" | "CANCELLED" | "RETURN_REQUESTED" | "RETURNED" | "REFUNDED" | null;
                    paymentStatus?: "PENDING" | "PAID" | "PARTIALLY_PAID" | "FAILED" | "REFUNDED" | null;
                    from?: string | null;
                    to?: string | null;
                    q?: string | null;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Paginated admin order list */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @enum {boolean} */
                            success: true;
                            data: {
                                items: ({
                                    id: string;
                                    orderNumber: string;
                                    status: string;
                                    paymentStatus: string;
                                    fulfillmentStatus: string;
                                    currency: string;
                                    subtotal?: unknown;
                                    discountAmount?: unknown;
                                    taxAmount?: unknown;
                                    shippingAmount?: unknown;
                                    grandTotal?: unknown;
                                    items: ({
                                        id: string;
                                        productName: string;
                                        sku: string;
                                        variantId?: string | null;
                                        quantity: number;
                                        unitPrice?: unknown;
                                        subtotal?: unknown;
                                    } & {
                                        [key: string]: unknown;
                                    })[];
                                } & {
                                    [key: string]: unknown;
                                })[];
                                pagination: components["schemas"]["PaginationMeta"];
                            };
                        };
                    };
                };
                /** @description Validation failed or malformed request */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Authentication required */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Forbidden - insufficient role */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Resource not found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Conflict - duplicate value or invalid state */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Too many requests */
                429: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/orders/admin/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get any order (admin)
         * @description Admin only. Full order detail including customer profile and payments.
         */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Admin order detail */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @enum {boolean} */
                            success: true;
                            data: {
                                id: string;
                                orderNumber: string;
                                status: string;
                                paymentStatus: string;
                                fulfillmentStatus: string;
                                currency: string;
                                subtotal?: unknown;
                                discountAmount?: unknown;
                                taxAmount?: unknown;
                                shippingAmount?: unknown;
                                grandTotal?: unknown;
                                items: ({
                                    id: string;
                                    productName: string;
                                    sku: string;
                                    variantId?: string | null;
                                    quantity: number;
                                    unitPrice?: unknown;
                                    subtotal?: unknown;
                                } & {
                                    [key: string]: unknown;
                                })[];
                            } & {
                                [key: string]: unknown;
                            };
                        };
                    };
                };
                /** @description Validation failed or malformed request */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Authentication required */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Forbidden - insufficient role */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Resource not found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Conflict - duplicate value or invalid state */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Too many requests */
                429: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/orders/admin/{id}/status": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /**
         * Transition order status (admin)
         * @description Admin only. Advances the order through the allowed status state machine.
         */
        patch: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: string;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        /** @enum {string} */
                        status: "PENDING" | "CONFIRMED" | "PROCESSING" | "PACKED" | "SHIPPED" | "DELIVERED" | "CANCELLED" | "RETURN_REQUESTED" | "RETURNED" | "REFUNDED";
                        remarks?: string | null;
                    };
                };
            };
            responses: {
                /** @description Order status updated */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @enum {boolean} */
                            success: true;
                            message: string;
                            data: {
                                id: string;
                                status: string;
                                paymentStatus: string;
                            } & {
                                [key: string]: unknown;
                            };
                        };
                    };
                };
                /** @description Validation failed or malformed request */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Authentication required */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Forbidden - insufficient role */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Resource not found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Conflict - duplicate value or invalid state */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Too many requests */
                429: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        trace?: never;
    };
    "/api/v1/orders/admin/{id}/cancel": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Cancel any order (admin)
         * @description Admin only. Cancels an order and releases reserved stock.
         */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: string;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        reason?: string | null;
                    };
                };
            };
            responses: {
                /** @description Order cancelled */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @enum {boolean} */
                            success: true;
                            message: string;
                            data: {
                                id: string;
                                status: string;
                                paymentStatus: string;
                            } & {
                                [key: string]: unknown;
                            };
                        };
                    };
                };
                /** @description Validation failed or malformed request */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Authentication required */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Forbidden - insufficient role */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Resource not found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Conflict - duplicate value or invalid state */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Too many requests */
                429: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/payments/{orderId}/initiate": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Initiate a payment for an order
         * @description Authentication required. Creates a payment transaction for the order. Ownership is enforced: the order must belong to the authenticated customer.
         */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    orderId: string;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        /** @enum {string} */
                        method: "COD" | "SSLCOMMERZ";
                    };
                };
            };
            responses: {
                /** @description Payment initiated */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @enum {boolean} */
                            success: true;
                            data: {
                                paymentId: string;
                                method: string;
                                redirectUrl?: string | null;
                                status?: string;
                            } & {
                                [key: string]: unknown;
                            };
                        };
                    };
                };
                /** @description Validation failed or malformed request */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Authentication required */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Forbidden - insufficient role */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Resource not found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Conflict - duplicate value or invalid state */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Too many requests */
                429: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/payments/cod/eligibility": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Check COD eligibility for an order
         * @description Authentication required. Returns whether cash-on-delivery is allowed for the order based on policy limits (max order value, outstanding COD count).
         */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        /** Format: uuid */
                        orderId: string;
                    };
                };
            };
            responses: {
                /** @description COD eligibility result */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @enum {boolean} */
                            success: true;
                            data: {
                                eligible: boolean;
                                orderId: string;
                            } & {
                                [key: string]: unknown;
                            };
                        };
                    };
                };
                /** @description Validation failed or malformed request */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Authentication required */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Forbidden - insufficient role */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Resource not found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Conflict - duplicate value or invalid state */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Too many requests */
                429: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/payments/cod/{paymentId}/collect": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Collect a COD payment
         * @description Admin only. Marks a COD payment as collected. The acting admin is taken from the session; the actor id is never accepted from the request body.
         */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    paymentId: string;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        /** Format: uuid */
                        paymentId: string;
                    };
                };
            };
            responses: {
                /** @description COD payment collected */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @enum {boolean} */
                            success: true;
                            message: string;
                        };
                    };
                };
                /** @description Validation failed or malformed request */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Authentication required */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Forbidden - insufficient role */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Resource not found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Conflict - duplicate value or invalid state */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Too many requests */
                429: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/payments/sslcommerz/{type}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * SSLCommerz callback (GET)
         * @description Webhook callback from the SSLCommerz payment gateway (GET/POST). Signature-verified - no bearer token required.
         */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    type: "success" | "fail" | "cancel" | "ipn";
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Callback processed */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @enum {boolean} */
                            success: true;
                            data: {
                                success?: boolean;
                                status?: string;
                            } & {
                                [key: string]: unknown;
                            };
                        };
                    };
                };
                /** @description Validation failed or malformed request */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Authentication required */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Forbidden - insufficient role */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Resource not found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Conflict - duplicate value or invalid state */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Too many requests */
                429: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        put?: never;
        /**
         * SSLCommerz callback (POST)
         * @description Webhook callback from the SSLCommerz payment gateway (GET/POST). Signature-verified - no bearer token required.
         */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    type: "success" | "fail" | "cancel" | "ipn";
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        [key: string]: unknown;
                    };
                };
            };
            responses: {
                /** @description Callback processed */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @enum {boolean} */
                            success: true;
                            data: {
                                success?: boolean;
                                status?: string;
                            } & {
                                [key: string]: unknown;
                            };
                        };
                    };
                };
                /** @description Validation failed or malformed request */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Authentication required */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Forbidden - insufficient role */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Resource not found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Conflict - duplicate value or invalid state */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Too many requests */
                429: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/coupons/admin": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * List coupons
         * @description Admin only. Paginated coupon listing with filtering.
         */
        get: {
            parameters: {
                query?: {
                    page?: number;
                    limit?: number;
                    status?: "DRAFT" | "ACTIVE" | "EXPIRED" | "DISABLED" | null;
                    isActive?: "true" | "false" | null;
                    q?: string | null;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Paginated coupon list */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @enum {boolean} */
                            success: true;
                            data: {
                                items: ({
                                    id: string;
                                    code: string;
                                    name: string;
                                    description?: string | null;
                                    status: string;
                                    discountType: string;
                                    discountValue: number;
                                    minimumOrderAmount?: number | null;
                                    maximumDiscountAmount?: number | null;
                                    usageLimit?: number | null;
                                    usageCount: number;
                                    usageLimitPerCustomer?: number | null;
                                    startsAt: string;
                                    expiresAt: string;
                                    isActive: boolean;
                                    applicableCategoryIds: string[];
                                    applicableProductIds: string[];
                                    campaignId?: string | null;
                                    createdAt: string;
                                    updatedAt: string;
                                } & {
                                    [key: string]: unknown;
                                })[];
                                pagination: components["schemas"]["PaginationMeta"];
                            };
                        };
                    };
                };
                /** @description Validation failed or malformed request */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Authentication required */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Forbidden - insufficient role */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Resource not found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Conflict - duplicate value or invalid state */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Too many requests */
                429: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        put?: never;
        /**
         * Create a coupon
         * @description Admin only. Discount values are stored and always recomputed server-side; client-supplied amounts are never trusted during checkout.
         */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        code: string;
                        name: string;
                        description?: string | null;
                        /**
                         * @default DRAFT
                         * @enum {string}
                         */
                        status?: "DRAFT" | "ACTIVE" | "EXPIRED" | "DISABLED";
                        /** @enum {string} */
                        discountType: "PERCENTAGE" | "FIXED_AMOUNT" | "FREE_SHIPPING";
                        discountValue: number | null;
                        minimumOrderAmount?: number | null;
                        maximumDiscountAmount?: number | null;
                        usageLimit?: number | null;
                        usageLimitPerCustomer?: number | null;
                        /** Format: date-time */
                        startsAt: string | null;
                        /** Format: date-time */
                        expiresAt: string | null;
                        /** @default true */
                        isActive?: boolean;
                        /** @default [] */
                        applicableCategoryIds?: string[];
                        /** @default [] */
                        applicableProductIds?: string[];
                        /** Format: uuid */
                        campaignId?: string | null;
                    };
                };
            };
            responses: {
                /** @description Coupon created */
                201: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @enum {boolean} */
                            success: true;
                            data: {
                                id: string;
                                code: string;
                                name: string;
                                description?: string | null;
                                status: string;
                                discountType: string;
                                discountValue: number;
                                minimumOrderAmount?: number | null;
                                maximumDiscountAmount?: number | null;
                                usageLimit?: number | null;
                                usageCount: number;
                                usageLimitPerCustomer?: number | null;
                                startsAt: string;
                                expiresAt: string;
                                isActive: boolean;
                                applicableCategoryIds: string[];
                                applicableProductIds: string[];
                                campaignId?: string | null;
                                createdAt: string;
                                updatedAt: string;
                            } & {
                                [key: string]: unknown;
                            };
                        };
                    };
                };
                /** @description Validation failed or malformed request */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Authentication required */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Forbidden - insufficient role */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Resource not found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Conflict - duplicate value or invalid state */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Too many requests */
                429: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/coupons/admin/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get a coupon
         * @description Admin only.
         */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Coupon detail */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @enum {boolean} */
                            success: true;
                            data: {
                                id: string;
                                code: string;
                                name: string;
                                description?: string | null;
                                status: string;
                                discountType: string;
                                discountValue: number;
                                minimumOrderAmount?: number | null;
                                maximumDiscountAmount?: number | null;
                                usageLimit?: number | null;
                                usageCount: number;
                                usageLimitPerCustomer?: number | null;
                                startsAt: string;
                                expiresAt: string;
                                isActive: boolean;
                                applicableCategoryIds: string[];
                                applicableProductIds: string[];
                                campaignId?: string | null;
                                createdAt: string;
                                updatedAt: string;
                            } & {
                                [key: string]: unknown;
                            };
                        };
                    };
                };
                /** @description Validation failed or malformed request */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Authentication required */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Forbidden - insufficient role */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Resource not found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Conflict - duplicate value or invalid state */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Too many requests */
                429: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        /**
         * Delete a coupon
         * @description Admin only. Soft-deletes the coupon.
         */
        delete: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Coupon deleted */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @enum {boolean} */
                            success: true;
                            data: {
                                id: string;
                                /** @enum {boolean} */
                                deleted: true;
                            };
                        };
                    };
                };
                /** @description Validation failed or malformed request */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Authentication required */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Forbidden - insufficient role */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Resource not found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Conflict - duplicate value or invalid state */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Too many requests */
                429: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        options?: never;
        head?: never;
        /**
         * Update a coupon
         * @description Admin only.
         */
        patch: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: string;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        code?: string;
                        name?: string;
                        description?: string | null;
                        /** @enum {string} */
                        status?: "DRAFT" | "ACTIVE" | "EXPIRED" | "DISABLED";
                        /** @enum {string} */
                        discountType?: "PERCENTAGE" | "FIXED_AMOUNT" | "FREE_SHIPPING";
                        discountValue?: number | null;
                        minimumOrderAmount?: number | null;
                        maximumDiscountAmount?: number | null;
                        usageLimit?: number | null;
                        usageLimitPerCustomer?: number | null;
                        /** Format: date-time */
                        startsAt?: string | null;
                        /** Format: date-time */
                        expiresAt?: string | null;
                        isActive?: boolean;
                        applicableCategoryIds?: string[];
                        applicableProductIds?: string[];
                        /** Format: uuid */
                        campaignId?: string | null;
                    };
                };
            };
            responses: {
                /** @description Coupon updated */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @enum {boolean} */
                            success: true;
                            data: {
                                id: string;
                                code: string;
                                name: string;
                                description?: string | null;
                                status: string;
                                discountType: string;
                                discountValue: number;
                                minimumOrderAmount?: number | null;
                                maximumDiscountAmount?: number | null;
                                usageLimit?: number | null;
                                usageCount: number;
                                usageLimitPerCustomer?: number | null;
                                startsAt: string;
                                expiresAt: string;
                                isActive: boolean;
                                applicableCategoryIds: string[];
                                applicableProductIds: string[];
                                campaignId?: string | null;
                                createdAt: string;
                                updatedAt: string;
                            } & {
                                [key: string]: unknown;
                            };
                        };
                    };
                };
                /** @description Validation failed or malformed request */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Authentication required */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Forbidden - insufficient role */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Resource not found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Conflict - duplicate value or invalid state */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Too many requests */
                429: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        trace?: never;
    };
    "/api/v1/cart/coupon": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Apply a coupon to the cart
         * @description Customer only. Validates the code against the cart and stores the server-computed discount. Rate limited to prevent code guessing. The discount is re-validated atomically during checkout.
         */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        code: string;
                    };
                };
            };
            responses: {
                /** @description Coupon applied - updated cart */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @enum {boolean} */
                            success: true;
                            data: {
                                id?: string | null;
                                customerProfileId?: string | null;
                                sessionId?: string | null;
                                items: unknown[];
                                itemCount: number;
                                subtotal: string;
                                discountAmount: string;
                                taxAmount: string;
                                shippingAmount: string;
                                grandTotal: string;
                            } & {
                                [key: string]: unknown;
                            };
                        };
                    };
                };
                /** @description Validation failed or malformed request */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Authentication required */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Forbidden - insufficient role */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Resource not found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Conflict - duplicate value or invalid state */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Too many requests */
                429: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        /**
         * Remove the applied coupon
         * @description Customer only. Removes the discount from the cart.
         */
        delete: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Coupon removed - updated cart */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @enum {boolean} */
                            success: true;
                            data: {
                                id?: string | null;
                                customerProfileId?: string | null;
                                sessionId?: string | null;
                                items: unknown[];
                                itemCount: number;
                                subtotal: string;
                                discountAmount: string;
                                taxAmount: string;
                                shippingAmount: string;
                                grandTotal: string;
                            } & {
                                [key: string]: unknown;
                            };
                        };
                    };
                };
                /** @description Validation failed or malformed request */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Authentication required */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Forbidden - insufficient role */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Resource not found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Conflict - duplicate value or invalid state */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Too many requests */
                429: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/wishlist": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * List my wishlist
         * @description Customer only. Returns the authenticated customer's wishlist with product details (name, image, price range, in-stock status), paginated. Items are always scoped to the session customer - other users' wishlists are never reachable.
         */
        get: {
            parameters: {
                query?: {
                    page?: number;
                    limit?: number;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Paginated wishlist */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @enum {boolean} */
                            success: true;
                            data: {
                                items: ({
                                    id: string;
                                    addedAt: string;
                                    product: {
                                        id: string;
                                        name: string;
                                        slug: string;
                                        shortDescription?: string | null;
                                        category?: {
                                            id: string;
                                            name: string;
                                            slug: string;
                                        } | null;
                                        brand?: {
                                            id: string;
                                            name: string;
                                            slug: string;
                                        } | null;
                                        image?: string | null;
                                        priceRange: {
                                            min: number;
                                            max: number;
                                        };
                                        inStock: boolean;
                                        availableStock: number;
                                    } & {
                                        [key: string]: unknown;
                                    };
                                } & {
                                    [key: string]: unknown;
                                })[];
                                pagination: components["schemas"]["PaginationMeta"];
                            };
                        };
                    };
                };
                /** @description Validation failed or malformed request */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Authentication required */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Forbidden - insufficient role */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Resource not found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Conflict - duplicate value or invalid state */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Too many requests */
                429: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        put?: never;
        /**
         * Add a product to my wishlist
         * @description Customer only. Idempotent - adding an already-present product returns 200 with `duplicate: true` instead of an error.
         */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        /** Format: uuid */
                        productId: string;
                    };
                };
            };
            responses: {
                /** @description Product already in wishlist (idempotent) */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @enum {boolean} */
                            success: true;
                            data: {
                                id: string;
                                productId: string;
                                addedAt: string;
                                duplicate: boolean;
                            } & {
                                [key: string]: unknown;
                            };
                        };
                    };
                };
                /** @description Product added to wishlist */
                201: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @enum {boolean} */
                            success: true;
                            data: {
                                id: string;
                                productId: string;
                                addedAt: string;
                                duplicate: boolean;
                            } & {
                                [key: string]: unknown;
                            };
                        };
                    };
                };
                /** @description Validation failed or malformed request */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Authentication required */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Forbidden - insufficient role */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Resource not found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Conflict - duplicate value or invalid state */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Too many requests */
                429: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/wishlist/{productId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /**
         * Remove a product from my wishlist
         * @description Customer only. Ownership is implicit from the session; the productId is taken from the path, never from the body.
         */
        delete: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    productId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Product removed from wishlist */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @enum {boolean} */
                            success: true;
                            data: {
                                productId: string;
                                /** @enum {boolean} */
                                removed: true;
                            } & {
                                [key: string]: unknown;
                            };
                        };
                    };
                };
                /** @description Validation failed or malformed request */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Authentication required */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Forbidden - insufficient role */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Resource not found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Conflict - duplicate value or invalid state */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Too many requests */
                429: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/wishlist/{productId}/move-to-cart": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Move a wishlist product to the cart
         * @description Customer only. Resolves a purchasable variant (default first, else any in-stock), adds one unit to the cart, and removes the item from the wishlist.
         */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    productId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Moved to cart */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @enum {boolean} */
                            success: true;
                            data: {
                                productId: string;
                                variantId: string;
                            } & {
                                [key: string]: unknown;
                            };
                        };
                    };
                };
                /** @description Validation failed or malformed request */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Authentication required */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Forbidden - insufficient role */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Resource not found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Conflict - duplicate value or invalid state */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Too many requests */
                429: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/products/{productId}/reviews": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * List approved reviews for a product
         * @description Public. Returns only approved reviews with the customer's display name (never the profile id or email), paginated and filterable by rating.
         */
        get: {
            parameters: {
                query?: {
                    page?: number;
                    limit?: number;
                    rating?: number;
                };
                header?: never;
                path: {
                    productId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Paginated review list */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @enum {boolean} */
                            success: true;
                            data: {
                                items: ({
                                    id: string;
                                    rating: number;
                                    comment?: string | null;
                                    images: string[];
                                    verifiedPurchase: boolean;
                                    createdAt: string;
                                    customer: {
                                        name: string;
                                    };
                                } & {
                                    [key: string]: unknown;
                                })[];
                                pagination: components["schemas"]["PaginationMeta"];
                            };
                        };
                    };
                };
                /** @description Validation failed or malformed request */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Authentication required */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Forbidden - insufficient role */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Resource not found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Conflict - duplicate value or invalid state */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Too many requests */
                429: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        put?: never;
        /**
         * Submit a product review
         * @description Customer only. One review per customer per product (409 on duplicate). An optional orderId is ownership-checked and must be a delivered order that contains the product to set the verified-purchase badge. Comments are HTML-escaped server-side. Reviews start unapproved pending admin moderation. Rate limited to prevent spam.
         */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    productId: string;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        rating: number;
                        comment?: string;
                        /** Format: uuid */
                        orderId?: string;
                        images?: string[];
                    };
                };
            };
            responses: {
                /** @description Review submitted for moderation */
                201: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @enum {boolean} */
                            success: true;
                            data: {
                                id: string;
                                rating: number;
                                comment?: string | null;
                                images: string[];
                                isApproved: boolean;
                                verifiedPurchase: boolean;
                            } & {
                                [key: string]: unknown;
                            };
                        };
                    };
                };
                /** @description Validation failed or malformed request */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Authentication required */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Forbidden - insufficient role */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Resource not found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Conflict - duplicate value or invalid state */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Too many requests */
                429: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/reviews/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /**
         * Delete a review
         * @description The review's owner or an admin may delete it. Non-owners get 404.
         */
        delete: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Review deleted */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @enum {boolean} */
                            success: true;
                            data: {
                                id: string;
                                /** @enum {boolean} */
                                deleted: true;
                            };
                        };
                    };
                };
                /** @description Validation failed or malformed request */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Authentication required */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Forbidden - insufficient role */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Resource not found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Conflict - duplicate value or invalid state */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Too many requests */
                429: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        options?: never;
        head?: never;
        /**
         * Edit my review
         * @description Customer only. The review must belong to the authenticated customer (others get 404). Recomputes the product rating aggregate when the review was already approved.
         */
        patch: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: string;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        rating?: number;
                        comment?: string;
                        images?: string[];
                    };
                };
            };
            responses: {
                /** @description Review updated */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @enum {boolean} */
                            success: true;
                            data: {
                                id: string;
                                rating: number;
                            } & {
                                [key: string]: unknown;
                            };
                        };
                    };
                };
                /** @description Validation failed or malformed request */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Authentication required */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Forbidden - insufficient role */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Resource not found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Conflict - duplicate value or invalid state */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Too many requests */
                429: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        trace?: never;
    };
    "/api/v1/admin/reviews": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Review moderation queue
         * @description Admin only. Lists reviews filtered by moderation status.
         */
        get: {
            parameters: {
                query?: {
                    page?: number;
                    limit?: number;
                    rating?: number;
                    status?: "pending" | "approved";
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Paginated review list */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @enum {boolean} */
                            success: true;
                            data: {
                                items: ({
                                    id: string;
                                    rating: number;
                                    comment?: string | null;
                                    images: string[];
                                    verifiedPurchase: boolean;
                                    createdAt: string;
                                    customer: {
                                        name: string;
                                    };
                                } & {
                                    [key: string]: unknown;
                                })[];
                                pagination: components["schemas"]["PaginationMeta"];
                            };
                        };
                    };
                };
                /** @description Validation failed or malformed request */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Authentication required */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Forbidden - insufficient role */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Resource not found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Conflict - duplicate value or invalid state */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Too many requests */
                429: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/reviews/{id}/approve": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /**
         * Approve a review
         * @description Admin only. Approving publishes the review and updates the product's average rating / review count.
         */
        patch: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Review approved */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @enum {boolean} */
                            success: true;
                            data: {
                                id: string;
                                rating: number;
                            } & {
                                [key: string]: unknown;
                            };
                        };
                    };
                };
                /** @description Validation failed or malformed request */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Authentication required */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Forbidden - insufficient role */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Resource not found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Conflict - duplicate value or invalid state */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Too many requests */
                429: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        trace?: never;
    };
};
export type webhooks = Record<string, never>;
export type components = {
    schemas: {
        ErrorResponse: {
            /** @enum {boolean} */
            success: false;
            message: string;
            fieldErrors?: {
                [key: string]: string[];
            };
            stack?: string;
        };
        PaginationMeta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    };
    responses: never;
    parameters: never;
    requestBodies: never;
    headers: never;
    pathItems: never;
};
export type $defs = Record<string, never>;
export type operations = Record<string, never>;
