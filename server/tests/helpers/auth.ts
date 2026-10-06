import { randomUUID } from "node:crypto";
import { makeSignature } from "better-auth/crypto";
import { prisma } from "../../src/lib/prisma.ts";
import { env } from "../../src/config/env.ts";
import type { CleanupTracker } from "./tracker.ts";

export type TestRole = "CUSTOMER" | "ADMIN" | "VENDOR";

export interface TestUser {
  id: string;
  email: string;
  name: string;
  role: TestRole;
  cookie: string;
  customerProfileId: string;
}

const cookieName = "rangalay.session_token";

export const sessionCookie = async (sessionToken: string) => {
  const signature = await makeSignature(sessionToken, env.BETTER_AUTH_SECRET);
  return `${cookieName}=${sessionToken}.${signature}`;
};

export const createTestUser = async (
  tracker: CleanupTracker,
  opts?: { role?: TestRole; suffix?: string; isApproved?: boolean }
): Promise<TestUser> => {
  const id = randomUUID();
  const suffix = opts?.suffix ?? randomUUID().slice(0, 8);
  const email = `test-${suffix}@example.test`;
  const role = opts?.role ?? "CUSTOMER";

  await prisma.user.create({
    data: {
      id,
      name: `Test ${role} ${suffix}`,
      email,
      emailVerified: true,
      role,
    },
  });
  tracker.userIds.push(id);

  if (role === "VENDOR") {
    await prisma.vendorProfile.create({
      data: {
        userId: id,
        shopSlug: `shop-${suffix}`,
        shopName: `Shop ${suffix}`,
        isApproved: opts?.isApproved ?? true,
      },
    });
  }

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
