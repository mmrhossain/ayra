import type { Request, Response } from "express";
import { AppError } from "../../common/errors/AppError.ts";
import { asyncHandler } from "../../common/utils/asyncHandler.ts";
import { requireParam } from "../../common/utils/requireParam.ts";
import { successResponse } from "../../common/utils/response.ts";
import {
  acceptStaffInvitationWithCredentials,
  getInvitationByToken,
  inviteStaff,
  listAdminStaff,
  listStaffInvitations,
  offboardStaff,
  reactivateStaff,
  resendStaffInvitation,
  revokeStaffInvitation,
  suspendStaff,
  updateStaffAccess,
} from "./staff.service.ts";
import {
  acceptInvitationSchema,
  invitationListQuerySchema,
  invitationTokenSchema,
  inviteStaffSchema,
  staffListQuerySchema,
  updateStaffAccessSchema,
} from "./staff.validator.ts";

const requireActor = (req: Request) => {
  const user = req.auth?.user;
  if (!user) throw new AppError("Unauthorized", 401);

  return {
    id: user.id,
    email: user.email,
    role: typeof user.role === "string" ? user.role : null,
    isSuperAdmin: user.isSuperAdmin === true,
    adminPermissions: Array.isArray(user.adminPermissions)
      ? user.adminPermissions
      : [],
    adminActions: Array.isArray(user.adminActions) ? user.adminActions : [],
  };
};

export const listStaffHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const query = staffListQuerySchema.parse(req.query);
    const user = req.auth?.user;
    if (!user) throw new AppError("Unauthorized", 401);

    successResponse(
      res,
      await listAdminStaff({
        page: query.page,
        limit: query.limit,
        ...(query.search !== undefined ? { search: query.search } : {}),
        ...(query.status !== undefined ? { status: query.status } : {}),
        actor: {
          id: user.id,
          role: typeof user.role === "string" ? user.role : null,
          isSuperAdmin: user.isSuperAdmin === true,
          adminPermissions: Array.isArray(user.adminPermissions)
            ? user.adminPermissions
            : [],
          adminActions: Array.isArray(user.adminActions) ? user.adminActions : [],
        },
      }),
      "Staff fetched",
    );
  },
);

export const listStaffInvitationsHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const query = invitationListQuerySchema.parse(req.query);

    successResponse(
      res,
      await listStaffInvitations({
        page: query.page,
        limit: query.limit,
        ...(query.status !== undefined ? { status: query.status } : {}),
      }),
      "Staff invitations fetched",
    );
  },
);

export const inviteStaffHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const body = inviteStaffSchema.parse(req.body);
    const actor = requireActor(req);

    successResponse(
      res,
      await inviteStaff({ ...body, actor }),
      "Staff invitation sent",
      201,
    );
  },
);

export const resendStaffInvitationHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const actor = requireActor(req);
    const invitationId = requireParam(req.params.id, "id");

    successResponse(
      res,
      await resendStaffInvitation({ actor, invitationId }),
      "Staff invitation resent",
    );
  },
);

export const revokeStaffInvitationHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const actor = requireActor(req);
    const invitationId = requireParam(req.params.id, "id");

    successResponse(
      res,
      await revokeStaffInvitation({ actor, invitationId }),
      "Staff invitation revoked",
    );
  },
);

export const getInvitationByTokenHandler = asyncHandler(
  async (req: Request, res: Response) => {
    // The token is a bearer capability, so it travels in the body rather than
    // the URL where access logs and proxies would record it.
    const { token } = invitationTokenSchema.parse(req.body);
    const invitation = await getInvitationByToken(token);

    if (!invitation) {
      throw new AppError("Invitation not found", 404);
    }

    successResponse(res, invitation, "Invitation fetched");
  },
);

export const acceptInvitationHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const body = acceptInvitationSchema.parse(req.body);

    successResponse(
      res,
      await acceptStaffInvitationWithCredentials({
        token: body.token,
        ...(body.name !== undefined ? { name: body.name } : {}),
        ...(body.password !== undefined ? { password: body.password } : {}),
        ...(req.auth?.user.id ? { sessionUserId: req.auth.user.id } : {}),
      }),
      "Invitation accepted",
    );
  },
);

export const updateStaffAccessHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const body = updateStaffAccessSchema.parse(req.body);
    const actor = requireActor(req);

    successResponse(
      res,
      await updateStaffAccess({
        actor,
        targetId: requireParam(req.params.id, "id"),
        permissions: body.permissions,
        ...(body.actions !== undefined ? { actions: body.actions } : {}),
        ...(body.isSuperAdmin !== undefined
          ? { isSuperAdmin: body.isSuperAdmin }
          : {}),
      }),
      "Staff access updated",
    );
  },
);

export const suspendStaffHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const actor = requireActor(req);

    successResponse(
      res,
      await suspendStaff({
        actor,
        targetId: requireParam(req.params.id, "id"),
      }),
      "Staff member suspended",
    );
  },
);

export const reactivateStaffHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const actor = requireActor(req);

    successResponse(
      res,
      await reactivateStaff({
        actor,
        targetId: requireParam(req.params.id, "id"),
      }),
      "Staff member reactivated",
    );
  },
);

export const offboardStaffHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const actor = requireActor(req);

    successResponse(
      res,
      await offboardStaff({
        actor,
        targetId: requireParam(req.params.id, "id"),
      }),
      "Staff member offboarded",
    );
  },
);
