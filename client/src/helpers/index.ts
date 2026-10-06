import { toast } from "sonner";
import Swal from "sweetalert2";

export const getAutoColumns = (count: number): number => {
  if (count <= 6) return 1;
  if (count <= 12) return 2;
  if (count <= 18) return 3;

  return 4;
};

export function splitCategoryColumns<T>(data: T[], colCount: number): T[][] {
  const columns: T[][] = Array.from({ length: colCount }, () => []);

  let colIndex = 0;

  data.forEach((item) => {
    columns[colIndex].push(item);

    colIndex++;
    if (colIndex >= colCount) colIndex = 0;
  });

  return columns;
}

export const slugify = (text?: string): string => {
  if (!text) return "";
  return text
    .toLowerCase()
    .trim()
    .replace(/&/g, "and") // & → and
    .replace(/[^a-z0-9\s-]/g, "") // remove special chars
    .replace(/\s+/g, "-"); // spaces → dash
};

export const successToast = (message: string) => {
  toast.success(message);
};

export const errorToast = (message: string) => {
  toast.error(message);
};

export const baseURL: string = process.env.NEXT_PUBLIC_API_BASE_URL || "";

export { formatPrice } from "@/lib/format";

export const buildQueryString = (
  params?: Record<string, string | number | boolean | null | undefined>,
): string => {
  if (!params) return "";
  return (
    "?" +
    new URLSearchParams(
      Object.entries(params)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => [k, String(v)]),
    ).toString()
  );
};

// get user id from localStorge
export const getUserId = (): number | null => {
  if (typeof window === "undefined") return null;

  const guestStr = localStorage.getItem("guest_user");

  if (guestStr) {
    try {
      const guest = JSON.parse(guestStr);

      if (Date.now() > guest.expiry) {
        localStorage.removeItem("guest_user");
        return null;
      }

      return Number(guest.value) || null;
    } catch {
      localStorage.removeItem("guest_user");
      return null;
    }
  }

  const userId = localStorage.getItem("user_id");

  if (!userId) return null;

  const parsedId = Number(userId);
  return isNaN(parsedId) ? null : parsedId;
};

// set user id in localStorge
export const setUserId = (hours = 2) => {
  const userId = String(Math.floor(Math.random() * 1000000));

  const data = {
    value: userId,
    expiry: Date.now() + hours * 60 * 60 * 1000, // default 2 hours
  };

  localStorage.setItem("guest_user", JSON.stringify(data));

  return Number(userId);
};

// get login user
export const getUser = () => {
  return null;
};

export const statusColor = (status?: string | null) => {
  if (!status)
    return "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700";

  switch (status.toLowerCase()) {
    case "pending":
      return "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800";
    case "confirmed":
      return "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800";
    case "processing":
      return "bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-950 dark:text-indigo-300 dark:border-indigo-800";
    case "packed":
      return "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800";
    case "shipped":
      return "bg-sky-100 text-sky-800 border-sky-200 dark:bg-sky-950 dark:text-sky-300 dark:border-sky-800";
    case "delivered":
    case "active": // ক্যাটাগরির active স্ট্যাটাসের জন্য সবুজ রঙ (completed/delivered এর মতো)
      return "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800";
    case "completed":
      return "bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-950 dark:text-teal-300 dark:border-teal-800";
    case "cancelled":
    case "inactive": // ক্যাটাগরির inactive স্ট্যাটাসের জন্য লালচে/রোস রঙ (cancelled এর মতো)
      return "bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800";
    case "return_requested":
      return "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800";
    case "returned":
      return "bg-pink-100 text-pink-800 border-pink-200 dark:bg-pink-950 dark:text-pink-300 dark:border-pink-800";
    case "refunded":
      return "bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700";
    default:
      return "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700";
  }
};

export const DeleteAlert = async () => {
  const result = await Swal.fire({
    title: "Are you sure?",
    text: "You won't be able to remove this!",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#3085d6",
    cancelButtonColor: "#d33",
    confirmButtonText: "Yes, remove it!",
    allowOutsideClick: false,
  });
  return result.isConfirmed;
};

export const SuccessAlert = async (msg: string) => {
  const result = await Swal.fire({
    text: msg,
    icon: "success",
    confirmButtonColor: "#198754",
    confirmButtonText: "OK",
    allowOutsideClick: false,
  });
  return result.isConfirmed;
};

const GUEST_SESSION_KEY = "guest_session_id";

export function getGuestSessionId(): string | null {
  if (typeof window === "undefined") return null;
  const value = localStorage.getItem(GUEST_SESSION_KEY);
  return value && value.length > 0 ? value : null;
}

export function getOrCreateGuestSessionId(): string {
  const existing = getGuestSessionId();
  if (existing) return existing;
  const sessionId =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `guest-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  localStorage.setItem(GUEST_SESSION_KEY, sessionId);
  return sessionId;
}

export function clearGuestSessionId(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(GUEST_SESSION_KEY);
}


