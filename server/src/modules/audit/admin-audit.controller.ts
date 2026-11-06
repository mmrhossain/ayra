import type { Request, Response } from "express";
import { asyncHandler } from "../../common/utils/asyncHandler.ts";
import { successResponse } from "../../common/utils/response.ts";
import { prisma } from "../../lib/prisma.ts";
import {
  auditLogCsvFilename,
  toAuditLogCsv,
} from "./admin-audit.csv.ts";
import {
  exportAdminAuditLogs,
  listAdminAuditLogs,
} from "./admin-audit.service.ts";
import {
  exportAdminAuditLogsQuerySchema,
  listAdminAuditLogsQuerySchema,
} from "./admin-audit.validator.ts";

export const listAdminAuditLogsHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const query = listAdminAuditLogsQuerySchema.parse(req.query);
    successResponse(
      res,
      await listAdminAuditLogs(query),
      "Admin audit logs fetched",
    );
  },
);

export const exportAdminAuditLogsHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const filters = exportAdminAuditLogsQuerySchema.parse(req.query);
    const rows = await exportAdminAuditLogs(filters);
    const csv = toAuditLogCsv(rows);

    res.status(200);
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${auditLogCsvFilename()}"`,
    );
    res.send(csv);
  },
);

export const getAdminAuditLogHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const id = String(req.params.id ?? "");
    const item = await prisma.adminAuditLog.findUnique({ where: { id } });
    if (!item) {
      res.status(404);
      res.json({ success: false, message: "Audit log entry not found" });
      return;
    }
    successResponse(res, item, "Admin audit log fetched");
  },
);
