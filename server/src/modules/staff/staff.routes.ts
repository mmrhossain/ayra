import { Router } from "express";
import {
  optionalAuth,
  requireAdminAction,
  requireAuth,
  requireRole,
  requireSuperAdmin,
} from "../../common/middleware/auth.middleware.ts";
import {
  acceptInvitationHandler,
  getInvitationByTokenHandler,
  inviteStaffHandler,
  listStaffHandler,
  listStaffInvitationsHandler,
  offboardStaffHandler,
  reactivateStaffHandler,
  resendStaffInvitationHandler,
  revokeStaffInvitationHandler,
  suspendStaffHandler,
  updateStaffAccessHandler,
} from "./staff.controller.ts";

const router = Router();

/**
 * Public invitation lookup. The token is the capability; nothing privileged is
 * returned, only the invited email/name and the invitation state so the
 * acceptance page can render a form.
 */
router.post("/staff/invitations/lookup", getInvitationByTokenHandler);

/**
 * Acceptance requires an authenticated account whose email matches the
 * invitation. Better Auth creates the credential account first (supported
 * signup flow); this endpoint only grants staff access afterwards.
 */
router.post(
  "/staff/invitations/accept",
  optionalAuth,
  acceptInvitationHandler,
);

router.get(
  "/admin/staff",
  requireAuth,
  requireRole("ADMIN"),
  requireAdminAction("staff:read"),
  listStaffHandler,
);

// Privilege assignment is owner-only: inviting staff or changing scopes is
// effectively creating administrators, so it is never delegated.
router.get(
  "/admin/staff/invitations",
  requireAuth,
  requireRole("ADMIN"),
  requireSuperAdmin,
  listStaffInvitationsHandler,
);

router.post(
  "/admin/staff/invitations",
  requireAuth,
  requireRole("ADMIN"),
  requireSuperAdmin,
  inviteStaffHandler,
);

router.post(
  "/admin/staff/invitations/:id/resend",
  requireAuth,
  requireRole("ADMIN"),
  requireSuperAdmin,
  resendStaffInvitationHandler,
);

router.post(
  "/admin/staff/invitations/:id/revoke",
  requireAuth,
  requireRole("ADMIN"),
  requireSuperAdmin,
  revokeStaffInvitationHandler,
);

router.patch(
  "/admin/staff/:id/access",
  requireAuth,
  requireRole("ADMIN"),
  requireSuperAdmin,
  updateStaffAccessHandler,
);

router.post(
  "/admin/staff/:id/suspend",
  requireAuth,
  requireRole("ADMIN"),
  requireAdminAction("staff:manage"),
  suspendStaffHandler,
);

router.post(
  "/admin/staff/:id/reactivate",
  requireAuth,
  requireRole("ADMIN"),
  requireAdminAction("staff:manage"),
  reactivateStaffHandler,
);

router.post(
  "/admin/staff/:id/offboard",
  requireAuth,
  requireRole("ADMIN"),
  requireAdminAction("staff:manage"),
  offboardStaffHandler,
);

export default router;
