import { createHash, randomBytes } from "node:crypto";
import { AppError } from "../../common/errors/AppError.ts";
import { paginated } from "../../common/utils/paginate.ts";
import {
  ADMIN_ACTIONS,
  ADMIN_PERMISSIONS,
  normalizeAdminActions,
  normalizeAdminPermissions,
  type AdminAction,
  type AdminPermission,
} from "../../common/utils/admin-permissions.ts";
import { normalizeRole } from "../../common/utils/roles.ts";
import { logger } from "../../common/looger/logger.ts";
import { env } from "../../config/env.ts";
import { auth } from "../../lib/auth.ts";
import { prisma, transaction } from "../../lib/prisma.ts";
import {
  assertOwnerRemains,
  lockOwnerGuard,
} from "../../lib/owner-guard.ts";
import { revokeUserSessions } from "../../lib/sessions.ts";
import { getBaseEmailTemplate } from "../../template/email.ts";
import { resend } from "../../lib/resend.ts";
import { recordStaffAudit } from "./staff.audit.ts";

export const INVITATION_TTL_MS = 72 * 60 * 60 * 1000;

const adminRoleWhere = {
  role: { equals: "admin", mode: "insensitive" as const },
  deletedAt: null,
};

const staffSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  adminPermissions: true,
  adminActions: true,
  isSuperAdmin: true,
  staffStatus: true,
  banned: true,
  banReason: true,
  createdAt: true,
  updatedAt: true,
} as const;

type StaffRecord = {
  id: string;
  name: string;
  email: string;
  role: string | null;
  adminPermissions: string[];
  adminActions: string[];
  isSuperAdmin: boolean;
  staffStatus: string;
  banned: boolean | null;
  banReason: string | null;
  createdAt: Date;
  updatedAt: Date;
};

const serializeStaff = (staff: StaffRecord) => ({
  id: staff.id,
  name: staff.name,
  email: staff.email,
  role: normalizeRole(staff.role),
  adminPermissions: normalizeAdminPermissions(staff.adminPermissions),
  adminActions: normalizeAdminActions(staff.adminActions),
  isSuperAdmin: staff.isSuperAdmin,
  status: staff.banned ? "SUSPENDED" : staff.staffStatus,
  banned: staff.banned ?? false,
  banReason: staff.banReason ?? null,
  createdAt: staff.createdAt.toISOString(),
  updatedAt: staff.updatedAt.toISOString(),
});

export type StaffMemberView = ReturnType<typeof serializeStaff>;

const invitationSelect = {
  id: true,
  email: true,
  name: true,
  permissions: true,
  isSuperAdmin: true,
  status: true,
  expiresAt: true,
  invitedById: true,
  acceptedAt: true,
  revokedAt: true,
  lastSentAt: true,
  createdAt: true,
} as const;

const serializeInvitation = (invitation: {
  id: string;
  email: string;
  name: string;
  permissions: string[];
  isSuperAdmin: boolean;
  status: string;
  expiresAt: Date;
  invitedById: string;
  acceptedAt: Date | null;
  revokedAt: Date | null;
  lastSentAt: Date;
  createdAt: Date;
}) => ({
  id: invitation.id,
  email: invitation.email,
  name: invitation.name,
  permissions: normalizeAdminPermissions(invitation.permissions),
  isSuperAdmin: invitation.isSuperAdmin,
  status:
    invitation.status === "PENDING" && invitation.expiresAt.getTime() <= Date.now()
      ? "EXPIRED"
      : invitation.status,
  expiresAt: invitation.expiresAt.toISOString(),
  invitedById: invitation.invitedById,
  acceptedAt: invitation.acceptedAt?.toISOString() ?? null,
  revokedAt: invitation.revokedAt?.toISOString() ?? null,
  lastSentAt: invitation.lastSentAt.toISOString(),
  createdAt: invitation.createdAt.toISOString(),
});

export type StaffInvitationView = ReturnType<typeof serializeInvitation>;

export async function listAdminStaff(query: {
  page: number;
  limit: number;
  search?: string | undefined;
  status?: "ACTIVE" | "SUSPENDED" | "OFFBOARDED" | undefined;
  actor: {
    id: string;
    isSuperAdmin: boolean;
    adminPermissions: string[];
    adminActions: string[];
    role?: string | null;
  };
}) {
  const where = {
    ...adminRoleWhere,
    ...(query.status === "ACTIVE"
      ? { staffStatus: "ACTIVE" as const, banned: { not: true } }
      : query.status === "SUSPENDED"
        ? {
            OR: [
              { staffStatus: "SUSPENDED" as const },
              { banned: true },
            ],
          }
        : query.status === "OFFBOARDED"
          ? { staffStatus: "OFFBOARDED" as const }
          : {}),
    ...(query.search
      ? {
          OR: [
            { name: { contains: query.search, mode: "insensitive" as const } },
            { email: { contains: query.search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: staffSelect,
      orderBy: [{ createdAt: "asc" }],
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    }),
    prisma.user.count({ where }),
  ]);

  return {
    ...paginated(items.map(serializeStaff), query.page, query.limit, total),
    canManage: query.actor.isSuperAdmin,
    canInvite: query.actor.isSuperAdmin,
    // Mirrors the route guard: `requireRole` needs the `staff` scope and
    // `staff:manage` is explicit-only, so both are required unless the actor is
    // a super admin (who bypasses scope checks).
    canSuspend:
      query.actor.isSuperAdmin ||
      (query.actor.adminPermissions.includes("staff") &&
        query.actor.adminActions.includes("staff:manage")),
    currentUserId: query.actor.id,
  };
}

export async function listStaffInvitations(args: {
  page: number;
  limit: number;
  status?: "PENDING" | "ACCEPTED" | "REVOKED" | "EXPIRED" | undefined;
}) {
  const where = {
    ...(args.status === "PENDING"
      ? { status: "PENDING" as const, expiresAt: { gt: new Date() } }
      : args.status === "EXPIRED"
        ? {
            OR: [
              { status: "EXPIRED" as const },
              { status: "PENDING" as const, expiresAt: { lte: new Date() } },
            ],
          }
        : args.status
          ? { status: args.status }
          : {}),
  };

  const [items, total] = await Promise.all([
    prisma.staffInvitation.findMany({
      where,
      select: invitationSelect,
      orderBy: [{ createdAt: "desc" }],
      skip: (args.page - 1) * args.limit,
      take: args.limit,
    }),
    prisma.staffInvitation.count({ where }),
  ]);

  return paginated(items.map(serializeInvitation), args.page, args.limit, total);
}

const hashInvitationToken = (token: string) =>
  createHash("sha256").update(token).digest("hex");

const normalizeEmail = (email: string) => email.trim().toLowerCase();

const sendInvitationEmail = async (input: {
  to: string;
  name: string;
  token: string;
}): Promise<void> => {
  const from = env.RESEND_FROM;
  const acceptUrl = `${env.FRONTEND_URL}/accept-invitation?token=${encodeURIComponent(input.token)}`;

  if (!env.RESEND_API_KEY || !from) {
    logger.warn({
      message: "Staff invitation email skipped: RESEND not configured",
      to: input.to,
      acceptUrl,
    });
    return;
  }

  const html = getBaseEmailTemplate({
    title: "You have been invited to the admin team",
    userName: input.name,
    message:
      "An administrator invited you to join the Ayra dashboard. Click below to set your password and activate your account. This link expires in 72 hours.",
    buttonText: "Accept invitation",
    buttonUrl: acceptUrl,
  });

  try {
    const { error } = await resend.emails.send({
      from,
      to: input.to,
      subject: "Your Ayra staff invitation",
      html,
    });
    if (error) {
      logger.error({
        message: "Staff invitation email failed",
        status: error.statusCode,
        name: error.name,
      });
    }
  } catch (err) {
    logger.error({
      message: "Staff invitation email failed",
      error: err instanceof Error ? err.message : String(err),
    });
  }
};

export async function inviteStaff(input: {
  actor: { id: string; email: string; role?: string | null };
  email: string;
  name: string;
  permissions: AdminPermission[];
  isSuperAdmin: boolean;
}) {
  const email = normalizeEmail(input.email);

  if (input.isSuperAdmin && input.permissions.length > 0) {
    throw new AppError(
      "A super admin invitation cannot also carry individual scopes",
      400,
    );
  }

  const [existingUser, pendingInvitation] = await Promise.all([
    prisma.user.findUnique({
      where: { email },
      select: { id: true, role: true, deletedAt: true },
    }),
    prisma.staffInvitation.findFirst({
      where: { email, status: "PENDING", expiresAt: { gt: new Date() } },
      select: { id: true },
    }),
  ]);

  if (existingUser && normalizeRole(existingUser.role) !== "CUSTOMER") {
    throw new AppError(
      "An account with this email already has staff access. Update its access instead.",
      409,
      "ACCOUNT_EXISTS",
    );
  }

  if (pendingInvitation) {
    throw new AppError(
      "A pending invitation already exists for this email",
      409,
      "INVITATION_PENDING",
    );
  }

  const token = randomBytes(32).toString("base64url");
  const tokenHash = hashInvitationToken(token);

  const invitation = await prisma.staffInvitation.create({
    data: {
      email,
      name: input.name,
      permissions: input.permissions,
      isSuperAdmin: input.isSuperAdmin,
      tokenHash,
      expiresAt: new Date(Date.now() + INVITATION_TTL_MS),
      invitedById: input.actor.id,
    },
    select: invitationSelect,
  });

  await recordStaffAudit({
    actor: input.actor,
    action: "staff.invitation.create",
    entityId: invitation.id,
    metadata: {
      email,
      permissions: input.permissions,
      isSuperAdmin: input.isSuperAdmin,
    },
  });

  await sendInvitationEmail({ to: email, name: input.name, token });

  return {
    invitation: serializeInvitation(invitation),
    // Only returned outside production so local previews and tests can accept
    // an invitation when email delivery is not configured.
    ...(env.isProduction ? {} : { token }),
  };
}

export async function resendStaffInvitation(input: {
  actor: { id: string; email: string; role?: string | null };
  invitationId: string;
}) {
  const invitation = await prisma.staffInvitation.findUnique({
    where: { id: input.invitationId },
  });

  if (!invitation) throw new AppError("Invitation not found", 404);
  if (invitation.status !== "PENDING") {
    throw new AppError("Only pending invitations can be resent", 400);
  }

  const token = randomBytes(32).toString("base64url");

  const updated = await prisma.staffInvitation.update({
    where: { id: invitation.id },
    data: {
      tokenHash: hashInvitationToken(token),
      expiresAt: new Date(Date.now() + INVITATION_TTL_MS),
      lastSentAt: new Date(),
    },
    select: invitationSelect,
  });

  await recordStaffAudit({
    actor: input.actor,
    action: "staff.invitation.resend",
    entityId: updated.id,
    metadata: { email: updated.email },
  });

  await sendInvitationEmail({
    to: updated.email,
    name: updated.name,
    token,
  });

  return {
    invitation: serializeInvitation(updated),
    ...(env.isProduction ? {} : { token }),
  };
}

export async function revokeStaffInvitation(input: {
  actor: { id: string; email: string; role?: string | null };
  invitationId: string;
}) {
  const invitation = await prisma.staffInvitation.findUnique({
    where: { id: input.invitationId },
  });

  if (!invitation) throw new AppError("Invitation not found", 404);
  if (invitation.status !== "PENDING") {
    throw new AppError("Only pending invitations can be revoked", 400);
  }

  const updated = await prisma.staffInvitation.update({
    where: { id: invitation.id },
    data: {
      status: "REVOKED",
      revokedAt: new Date(),
      revokedById: input.actor.id,
    },
    select: invitationSelect,
  });

  await recordStaffAudit({
    actor: input.actor,
    action: "staff.invitation.revoke",
    entityId: updated.id,
    metadata: { email: updated.email },
  });

  return serializeInvitation(updated);
}

/**
 * Accepts an invitation from the public acceptance page.
 *
 * Two safe paths exist:
 *  - The invited email has no account yet: the invitation token proves control
 *    of that mailbox, so the account is created through Better Auth's supported
 *    email/password sign-up and marked verified. The token is the credential
 *    that would otherwise be delivered by the verification email.
 *  - An account already exists (for example an existing customer): the caller
 *    must be signed in as that exact account. Linking a staff role to an
 *    account nobody authenticated would hand out privileges to whoever happens
 *    to type the address first.
 */
export async function acceptStaffInvitationWithCredentials(input: {
  token: string;
  name?: string | undefined;
  password?: string | undefined;
  sessionUserId?: string | undefined;
}) {
  const invitation = await getInvitationByToken(input.token);
  if (!invitation) throw new AppError("Invitation not found", 404);
  if (invitation.status === "EXPIRED") {
    throw new AppError(
      "Invitation has expired. Ask an administrator to resend it.",
      400,
      "INVITATION_EXPIRED",
    );
  }
  if (invitation.status !== "PENDING") {
    throw new AppError("Invitation is no longer valid", 400);
  }

  const existing = await prisma.user.findUnique({
    where: { email: invitation.email },
    select: { id: true, deletedAt: true },
  });

  let userId: string;

  if (existing) {
    if (existing.deletedAt) {
      throw new AppError("This account can no longer be used", 409);
    }
    if (!input.sessionUserId || input.sessionUserId !== existing.id) {
      throw new AppError(
        "Sign in with the invited email address to accept this invitation",
        401,
        "SIGN_IN_REQUIRED",
      );
    }
    userId = existing.id;
  } else {
    if (!input.password || input.password.length < 8) {
      throw new AppError(
        "Choose a password of at least 8 characters to activate your account",
        400,
        "PASSWORD_REQUIRED",
      );
    }

    try {
      const created = await auth.api.signUpEmail({
        body: {
          name: input.name?.trim() || invitation.name,
          email: invitation.email,
          password: input.password,
        },
      });

      if (!created?.user?.id) {
        throw new AppError("Could not create the account", 500);
      }
      userId = created.user.id;
    } catch (err) {
      if (err instanceof AppError) throw err;
      logger.warn({
        message: "Staff invitation sign-up failed",
        email: invitation.email,
        error: err instanceof Error ? err.message : String(err),
      });
      throw new AppError(
        "Could not create the account for this invitation",
        409,
        "ACCOUNT_CREATION_FAILED",
      );
    }

    // Possession of the invitation token proves control of the invited mailbox,
    // which is exactly what email verification establishes.
    await prisma.user.update({
      where: { id: userId },
      data: { emailVerified: true },
    });
  }

  return acceptStaffInvitation({ token: input.token, userId });
}

export async function getInvitationByToken(token: string) {
  const invitation = await prisma.staffInvitation.findUnique({
    where: { tokenHash: hashInvitationToken(token) },
    select: {
      id: true,
      email: true,
      name: true,
      status: true,
      expiresAt: true,
    },
  });

  if (!invitation) return null;

  const expired =
    invitation.status === "PENDING" && invitation.expiresAt.getTime() <= Date.now();

  return {
    id: invitation.id,
    email: invitation.email,
    name: invitation.name,
    status: expired ? "EXPIRED" : invitation.status,
    expiresAt: invitation.expiresAt.toISOString(),
  };
}

/**
 * Accepts an invitation after Better Auth has created the credential account.
 *
 * The invitation row is consumed with a conditional update so concurrent
 * acceptance attempts cannot both succeed. Privileges are applied only to the
 * freshly created user, never to a pre-existing account with the same email.
 */
export async function acceptStaffInvitation(input: {
  token: string;
  userId: string;
}) {
  const tokenHash = hashInvitationToken(input.token);

  return transaction(async (tx) => {
    await lockOwnerGuard(tx);

    const invitation = await tx.staffInvitation.findUnique({
      where: { tokenHash },
    });

    if (!invitation) {
      throw new AppError("Invitation not found", 404);
    }
    if (invitation.status !== "PENDING") {
      throw new AppError("Invitation is no longer valid", 400);
    }
    if (invitation.expiresAt.getTime() <= Date.now()) {
      await tx.staffInvitation.update({
        where: { id: invitation.id },
        data: { status: "EXPIRED" },
      });
      throw new AppError("Invitation has expired", 400);
    }

    const user = await tx.user.findUnique({
      where: { id: input.userId },
      select: { id: true, email: true, role: true },
    });

    if (!user) throw new AppError("Account not found", 404);

    if (normalizeEmail(user.email) !== invitation.email) {
      throw new AppError(
        "Invitation does not match the signed-in account",
        403,
      );
    }

    if (normalizeRole(user.role) !== "CUSTOMER") {
      throw new AppError("This account already has staff access", 409);
    }

    const consumed = await tx.staffInvitation.updateMany({
      where: { id: invitation.id, status: "PENDING" },
      data: {
        status: "ACCEPTED",
        acceptedAt: new Date(),
        acceptedById: user.id,
      },
    });

    if (consumed.count !== 1) {
      throw new AppError("Invitation has already been used", 409);
    }

    const updated = await tx.user.update({
      where: { id: user.id },
      data: {
        role: "ADMIN",
        adminPermissions: invitation.permissions,
        adminActions: [],
        isSuperAdmin: invitation.isSuperAdmin,
        staffStatus: "ACTIVE",
        emailVerified: true,
      },
      select: staffSelect,
    });

    return serializeStaff(updated);
  });
}

export async function updateStaffAccess(input: {
  actor: {
    id: string;
    email: string;
    role?: string | null;
    isSuperAdmin: boolean;
  };
  targetId: string;
  permissions: AdminPermission[];
  actions?: AdminAction[];
  isSuperAdmin?: boolean;
}) {
  if (input.actor.id === input.targetId) {
    throw new AppError("You cannot change your own access", 400);
  }

  const nextPermissions = normalizeAdminPermissions(input.permissions);
  const nextActions = normalizeAdminActions(input.actions ?? []);
  const nextIsSuperAdmin = input.isSuperAdmin === true;

  if (nextIsSuperAdmin && nextPermissions.length > 0) {
    throw new AppError(
      "A super admin cannot also be limited to individual scopes",
      400,
    );
  }

  const result = await transaction(async (tx) => {
    await lockOwnerGuard(tx);

    const target = await tx.user.findUnique({
      where: { id: input.targetId },
      select: {
        id: true,
        role: true,
        adminPermissions: true,
        adminActions: true,
        isSuperAdmin: true,
        staffStatus: true,
        banned: true,
      },
    });

    if (!target || normalizeRole(target.role) !== "ADMIN") {
      throw new AppError("Staff member not found", 404);
    }

    const wasActiveSuperAdmin =
      target.isSuperAdmin &&
      target.staffStatus === "ACTIVE" &&
      target.banned !== true;
    const remainsActiveSuperAdmin =
      nextIsSuperAdmin &&
      target.staffStatus === "ACTIVE" &&
      target.banned !== true;

    if (wasActiveSuperAdmin && !remainsActiveSuperAdmin) {
      await assertOwnerRemains(tx, target.id);
    }

    const updated = await tx.user.update({
      where: { id: target.id },
      data: {
        adminPermissions: nextPermissions,
        adminActions: nextActions,
        isSuperAdmin: nextIsSuperAdmin,
      },
      select: staffSelect,
    });

    return updated;
  });

  // Fail closed: even if Redis invalidation fails, `requireAuth` reads the
  // fresh row on the next request, so the old cookie cannot retain access.
  await revokeUserSessions(result.id);

  await recordStaffAudit({
    actor: input.actor,
    action: "staff.access.update",
    entityId: result.id,
    metadata: {
      permissions: nextPermissions,
      actions: nextActions,
      isSuperAdmin: nextIsSuperAdmin,
    },
  });

  return serializeStaff(result);
}

export async function suspendStaff(input: {
  actor: { id: string; email: string; role?: string | null };
  targetId: string;
}) {
  if (input.actor.id === input.targetId) {
    throw new AppError("You cannot suspend your own account", 400);
  }

  const result = await transaction(async (tx) => {
    await lockOwnerGuard(tx);

    const target = await tx.user.findUnique({
      where: { id: input.targetId },
      select: {
        id: true,
        role: true,
        isSuperAdmin: true,
        staffStatus: true,
        banned: true,
      },
    });

    if (!target || normalizeRole(target.role) !== "ADMIN") {
      throw new AppError("Staff member not found", 404);
    }

    if (
      target.isSuperAdmin &&
      target.staffStatus === "ACTIVE" &&
      target.banned !== true
    ) {
      await assertOwnerRemains(tx, target.id);
    }

    return tx.user.update({
      where: { id: target.id },
      data: { staffStatus: "SUSPENDED" },
      select: staffSelect,
    });
  });

  await revokeUserSessions(result.id);

  await recordStaffAudit({
    actor: input.actor,
    action: "staff.suspend",
    entityId: result.id,
    metadata: { email: result.email },
  });

  return serializeStaff(result);
}

export async function reactivateStaff(input: {
  actor: { id: string; email: string; role?: string | null };
  targetId: string;
}) {
  const result = await transaction(async (tx) => {
    await lockOwnerGuard(tx);

    const target = await tx.user.findUnique({
      where: { id: input.targetId },
      select: { id: true, role: true, staffStatus: true },
    });

    // Offboarding turns the account back into a customer, so reactivation must
    // accept both suspended staff and previously-offboarded identities.
    const isStaff =
      normalizeRole(target?.role) === "ADMIN" ||
      target?.staffStatus === "OFFBOARDED";
    if (!target || !isStaff) {
      throw new AppError("Staff member not found", 404);
    }

    // Reactivation must not silently restore previously held privileges.
    return tx.user.update({
      where: { id: target.id },
      data: {
        role: "ADMIN",
        staffStatus: "ACTIVE",
        adminPermissions: [],
        adminActions: [],
        isSuperAdmin: false,
      },
      select: staffSelect,
    });
  });

  await recordStaffAudit({
    actor: input.actor,
    action: "staff.reactivate",
    entityId: result.id,
    metadata: { email: result.email },
  });

  return serializeStaff(result);
}

export async function offboardStaff(input: {
  actor: { id: string; email: string; role?: string | null };
  targetId: string;
}) {
  if (input.actor.id === input.targetId) {
    throw new AppError("You cannot offboard your own account", 400);
  }

  const result = await transaction(async (tx) => {
    await lockOwnerGuard(tx);

    const target = await tx.user.findUnique({
      where: { id: input.targetId },
      select: {
        id: true,
        role: true,
        isSuperAdmin: true,
        staffStatus: true,
        banned: true,
      },
    });

    if (!target || normalizeRole(target.role) !== "ADMIN") {
      throw new AppError("Staff member not found", 404);
    }

    if (
      target.isSuperAdmin &&
      target.staffStatus === "ACTIVE" &&
      target.banned !== true
    ) {
      await assertOwnerRemains(tx, target.id);
    }

    // Offboarding removes staff access but preserves the identity and any
    // customer-side data. Historical attribution columns are untouched.
    return tx.user.update({
      where: { id: target.id },
      data: {
        role: "CUSTOMER",
        staffStatus: "OFFBOARDED",
        adminPermissions: [],
        adminActions: [],
        isSuperAdmin: false,
      },
      select: staffSelect,
    });
  });

  await revokeUserSessions(result.id);

  await recordStaffAudit({
    actor: input.actor,
    action: "staff.offboard",
    entityId: result.id,
    metadata: { email: result.email },
  });

  return serializeStaff(result);
}

export const STAFF_PERMISSION_VALUES = ADMIN_PERMISSIONS;
export const STAFF_ACTION_VALUES = ADMIN_ACTIONS;
