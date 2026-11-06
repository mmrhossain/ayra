import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import type { AdminAuditLogItem } from "@/features/dashboard/admin/audit-log/types/models";

import { AuditLogDetailSheet } from "./audit-log-detail-sheet";

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

const item: AdminAuditLogItem = {
  id: "log-1",
  actorId: "user-1",
  actorEmail: "admin@example.com",
  actorRole: "ADMIN",
  action: "orders.update",
  source: "APP",
  method: "PATCH",
  path: "/api/v1/admin/orders/ord-1/status",
  statusCode: 200,
  outcome: "SUCCESS",
  entityType: "orders",
  entityId: "ord-1",
  ip: "127.0.0.1",
  userAgent: "vitest",
  requestId: "req-abc-123",
  durationMs: 42,
  metadata: { body: { status: "PACKED" } },
  createdAt: "2026-11-04T10:00:00.000Z",
};

describe("AuditLogDetailSheet", () => {
  it("renders telemetry and metadata for the selected entry", () => {
    act(() =>
      root.render(
        <AuditLogDetailSheet item={item} open onOpenChange={() => {}} />,
      ),
    );

    const text = document.body.textContent ?? "";
    expect(text).toContain("admin@example.com");
    expect(text).toContain("orders.update");
    expect(text).toContain("req-abc-123");
    expect(text).toContain("42 ms");
    expect(text).toContain("/api/v1/admin/orders/ord-1/status");
    expect(text).toContain("PACKED");
  });

  it("renders nothing but the shell when no item is selected", () => {
    act(() =>
      root.render(
        <AuditLogDetailSheet item={null} open onOpenChange={() => {}} />,
      ),
    );

    expect(document.body.textContent).toContain("Event details");
    expect(document.body.textContent).not.toContain("req-abc-123");
  });
});
