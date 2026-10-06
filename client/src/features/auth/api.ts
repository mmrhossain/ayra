/**
 * @deprecated Import customer profile from
 * `@/features/dashboard/customer/account/api/profile` and vendor profile from
 * `@/features/dashboard/vendor/profile/api/profile`.
 */
export {
  updateCustomerProfile,
  toProfileError,
  type CustomerProfile,
  type CustomerProfileUpdate,
} from "@/features/dashboard/customer/account/api/profile";
export {
  fetchVendorProfile,
  updateVendorProfile,
  type VendorProfile,
  type VendorProfileUpdate,
} from "@/features/dashboard/vendor/profile/api/profile";
