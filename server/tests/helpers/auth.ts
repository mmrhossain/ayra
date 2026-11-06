import { randomUUID } from "node:crypto";
import { makeSignature } from "better-auth/crypto";
import { prisma } from "../../src/lib/prisma.ts";
import { env } from "../../src/config/env.ts";
import type { CleanupTracker } from "./tracker.ts";

export type TestRole = "CUSTOMER" | "ADMIN";

export interface TestUser {
  id: string;
  email: string;
  name: string;
  role: TestRole;
  cookie: string;
  customerProfileId: string;
}

export interface CreateTestUserOptions {
  role?: TestRole;
  suffix?: string;
  /**
   * Scopes for a scoped ADMIN. Pass `[]` (default for ADMIN) for a super admin,
   * or a non-empty list for a restricted staff account.
   */
  adminPermissions?: string[];
  adminActions?: string[];
  /** Explicitly force super-admin status for an ADMIN fixture. */
  isSuperAdmin?: boolean;
}

const cookieName = "ayra.session_token";

export const sessionCookie = async (sessionToken: string) => {
  const signature = await makeSignature(sessionToken, env.BETTER_AUTH_SECRET);
  return `${cookieName}=${sessionToken}.${signature}`;
};

export const createTestUser = async (
  tracker: CleanupTracker,
  opts?: CreateTestUserOptions
): Promise<TestUser> => {
  const id = randomUUID();
  const suffix = opts?.suffix ?? randomUUID().slice(0, 8);
  const email = `test-${suffix}@example.test`;
  const role = opts?.role ?? "CUSTOMER";
  const isSuperAdmin =
    opts?.isSuperAdmin ?? (role === "ADMIN" && (opts?.adminPermissions ?? []).length === 0);

  await prisma.user.create({
    data: {
      id,
      name: `Test ${role} ${suffix}`,
      email,
      emailVerified: true,
      role,
      adminPermissions: opts?.adminPermissions ?? [],
      adminActions: opts?.adminActions ?? [],
      isSuperAdmin,
    },
  });
  tracker.userIds.push(id);

  const sessionToken = randomUUID();
  await prisma.session.create({
    data: {
      id: randomUUID(),
      token: sessionToken,
      userId: id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  const profile = await prisma.customerProfile.create({
    data: {
      userId: id,
      customerCode: `TEST-${suffix}`,
    },
  });

  return {
    id,
    email,
    name: `Test ${role} ${suffix}`,
    role,
    cookie: await sessionCookie(sessionToken),
    customerProfileId: profile.id,
  };
};
