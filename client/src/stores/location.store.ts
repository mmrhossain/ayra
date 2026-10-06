

import {create} from "zustand"
import axios from "axios";
import {LocationState} from "@/types/loaction";
const base_url = "https://bangladesh-geo-location.vercel.app/api/v1"


export const locationStore = create<LocationState>((set)=>({

    formState: {
        name: "",
        email: "",
        phone: "",
        country: "Bangladesh",
        address: "",
        division: "",
        district: "",
        thana: "",
        postal_code: "",
        shippingMethodCode: "",
    },

    handleChange: (name, value) =>
        set((state) => ({
            formState: {
                ...state.formState,
                [name]: value,
            },
        })),

    resetFormState: () =>
        set({
            formState: {
                name: "",
                email: "",
                phone: "",
                country: "Bangladesh",
                address: "",
                division: "",
                district: "",
                thana: "",
                postal_code: "",
                shippingMethodCode: "",
            },
        }),

    divisionList: null,

    fetchDivisionList: async ()=>{
        const result = await axios.get(`${base_url}/division-list`)
        const data = result?.data?.data
        set({divisionList: data})
    },

    districtList: null,
    fetchDistrictList: async (divisionID: string)=>{
        const result = await axios.get(`${base_url}/district-list/${divisionID}`)
        const data = result?.data?.data
        set({districtList: data})
    },

    postList: null,
    fetchPostList: async (districtID: string)=>{
        const result = await axios.get(`${base_url}/post-list/${districtID}`)
        const data = result?.data?.data
        set({postList: data})
    },

}))