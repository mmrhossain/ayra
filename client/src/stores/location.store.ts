import { create } from "zustand";

import {
  fetchDistricts,
  fetchDivisions,
  fetchUpazilas,
} from "@/features/geography/api/geography";
import type { GeoEntity } from "@/features/geography/types/models";

export type AreaOption = {
  code: string;
  name: string;
};

export type FormState = {
  name: string;
  email: string;
  phone: string;
  country: string;
  address: string;
  division: string;
  district: string;
  thana: string;
  divisionCode: string;
  districtCode: string;
  upazilaCode: string;
  postal_code: string;
  shippingMethodCode: string;
};

export type LocationState = {
  formState: FormState;
  handleChange: (name: keyof FormState, value: string) => void;
  resetFormState: () => void;
  divisionList: AreaOption[] | null;
  divisionParentCode: string | null;
  fetchDivisionList: () => Promise<void>;
  districtList: AreaOption[] | null;
  districtParentCode: string | null;
  fetchDistrictList: (divisionCode: string) => Promise<void>;
  upazilaList: AreaOption[] | null;
  upazilaParentCode: string | null;
  fetchUpazilaList: (districtCode: string) => Promise<void>;
  geoError: string | null;
};

const emptyFormState: FormState = {
  name: "",
  email: "",
  phone: "",
  country: "Bangladesh",
  address: "",
  division: "",
  district: "",
  thana: "",
  divisionCode: "",
  districtCode: "",
  upazilaCode: "",
  postal_code: "",
  shippingMethodCode: "",
};

const toOptions = (items: GeoEntity[]): AreaOption[] =>
  items.map((item) => ({ code: item.code, name: item.name }));

const GEO_ERROR = "Could not load locations. Please check your connection and retry.";

export const locationStore = create<LocationState>((set, get) => ({
  formState: { ...emptyFormState },

  handleChange: (name, value) =>
    set((state) => ({
      formState: {
        ...state.formState,
        [name]: value,
      },
    })),

  resetFormState: () => set({ formState: { ...emptyFormState } }),

  divisionList: null,
  divisionParentCode: null,

  fetchDivisionList: async () => {
    if (get().divisionList?.length) return;
    try {
      const list = await fetchDivisions();
      set({ divisionList: toOptions(list), geoError: null });
    } catch {
      set({ divisionList: [], geoError: GEO_ERROR });
    }
  },

  districtList: null,
  districtParentCode: null,

  fetchDistrictList: async (divisionCode: string) => {
    if (!divisionCode) {
      set({ districtList: [], districtParentCode: null });
      return;
    }
    if (
      get().districtParentCode === divisionCode &&
      get().districtList?.length
    ) {
      return;
    }
    try {
      const list = await fetchDistricts(divisionCode);
      set({
        districtList: toOptions(list),
        districtParentCode: divisionCode,
        geoError: null,
      });
    } catch {
      set({ districtList: [], districtParentCode: divisionCode, geoError: GEO_ERROR });
    }
  },

  upazilaList: null,
  upazilaParentCode: null,

  fetchUpazilaList: async (districtCode: string) => {
    if (!districtCode) {
      set({ upazilaList: [], upazilaParentCode: null });
      return;
    }
    if (
      get().upazilaParentCode === districtCode &&
      get().upazilaList?.length
    ) {
      return;
    }
    try {
      const list = await fetchUpazilas(districtCode);
      set({
        upazilaList: toOptions(list),
        upazilaParentCode: districtCode,
        geoError: null,
      });
    } catch {
      set({ upazilaList: [], upazilaParentCode: districtCode, geoError: GEO_ERROR });
    }
  },

  geoError: null,
}));
