const CSV_COLUMNS = [
  "createdAt",
  "actorEmail",
  "actorRole",
  "source",
  "action",
  "method",
  "path",
  "entityType",
  "entityId",
  "statusCode",
  "outcome",
  "durationMs",
  "requestId",
  "ip",
  "userAgent",
] as const;

type CsvRow = Record<(typeof CSV_COLUMNS)[number], unknown> & {
  metadata?: unknown;
};

const escapeCell = (value: unknown): string => {
  if (value === null || value === undefined) return "";
  const text =
    typeof value === "object" ? JSON.stringify(value) : String(value);
  const normalized = text.replace(/\r?\n/g, " ");
  if (/[",;]/.test(normalized)) {
    return `"${normalized.replace(/"/g, '""')}"`;
  }
  return normalized;
};

export function toAuditLogCsv(rows: CsvRow[]): string {
  const header = [...CSV_COLUMNS, "metadata"].join(",");
  const lines = rows.map((row) =>
    [
      ...CSV_COLUMNS.map((column) =>
        escapeCell(
          column === "createdAt" && row.createdAt instanceof Date
            ? row.createdAt.toISOString()
            : row[column],
        ),
      ),
      escapeCell(row.metadata),
    ].join(","),
  );

  return [header, ...lines].join("\r\n");
}

export function auditLogCsvFilename(date = new Date()): string {
  const stamp = date.toISOString().replace(/[:.]/g, "-").slice(0, 19);
  return `admin-audit-log-${stamp}.csv`;
}
