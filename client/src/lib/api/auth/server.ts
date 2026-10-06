import { BACKEND_URL } from "@/config/index";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export type AuthRole = "ADMIN" | "VENDOR" | "CUSTOMER";

export type UserSession = {
  user?: {
    id?: string;
    name?: string;
    email?: string;
    role?: string;
    createdAt?: string;
  };
} | null;

export const getUserSession = async (): Promise<UserSession> => {
  try {
    const cookieStore = await cookies();

    const cookieHeader = cookieStore
      .getAll()
      .map(({ name, value }) => `${name}=${value}`)
      .join("; ");

    if (!cookieHeader) return null;

    const response = await fetch(`${BACKEND_URL}/auth/get-session`, {
      headers: {
        Cookie: cookieHeader,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data?.user ? data : null;
  } catch (error) {
    console.error("Failed to get user session:", error);
    return null;
  }
};

export async function requireRole(
  ...roles: AuthRole[]
): Promise<NonNullable<UserSession>> {
  const session = await getUserSession();
  const role = session?.user?.role;

  if (!role) {
    redirect("/login");
  }

  if (!roles.includes(role as AuthRole)) {
    redirect("/unauthorized");
  }

  return session as NonNullable<UserSession>;
}
