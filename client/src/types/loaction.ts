export interface Division {
    _id: string;
    name: string;
}

export interface District {
    _id: string;
    name: string;
}

export interface Post {
    _id: string;
    name: string;
}

export interface FormState {
    name: string;
    email: string;
    phone: string;
    country: string;
    address: string;
    division: string;
    district: string;
    thana: string;
    postal_code: string;
    shippingMethodCode: string;
}


export interface LocationState {
    /* -------- Form -------- */
    formState: FormState;
    handleChange: (
        name: keyof FormState,
        value: string
    ) => void;
    resetFormState: () => void;

    /* -------- Location Lists -------- */
    divisionList: Division[] | null;
    fetchDivisionList: () => Promise<void>;

    districtList: District[] | null;
    fetchDistrictList: (divisionID: string) => Promise<void>;

    postList: Post[] | null;
    fetchPostList: (districtID: string) => Promise<void>;
}
