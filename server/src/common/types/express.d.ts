import type { AuthRole } from "./auth.ts";

declare global {
  namespace Express {
    interface Request {
      requestId?: string;
      auth?: {
        user: {
          id: string;
          name?: string | null;
          email: string;
          emailVerified?: boolean;
          role?: string | AuthRole | null | undefined;
          isApproved?: boolean | null | undefined;
          banned?: boolean | null | undefined;
          banReason?: string | null | undefined;
          banExpires?: Date | null | undefined;
          [key: string]: unknown;
        };
        session: {
          id: string;
          token: string;
          userId: string;
          expiresAt: Date;
          [key: string]: unknown;
        };
      } | null;
    }
  }
}

export {};
