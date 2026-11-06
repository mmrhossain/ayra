-- Audit request telemetry: correlate each write action with the request that
-- produced it (X-Request-Id) and store the handler latency for triage.

-- AlterTable
ALTER TABLE "admin_audit_log" ADD COLUMN "requestId" TEXT,
ADD COLUMN "durationMs" INTEGER;

-- CreateIndex
CREATE INDEX "admin_audit_log_requestId_idx" ON "admin_audit_log"("requestId");
