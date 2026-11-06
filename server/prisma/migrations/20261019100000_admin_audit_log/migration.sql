CREATE TABLE IF NOT EXISTS "admin_audit_log" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "actorEmail" TEXT,
    "actorRole" TEXT,
    "method" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "statusCode" INTEGER NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "ip" TEXT,
    "userAgent" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_audit_log_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "admin_audit_log_createdAt_idx"
    ON "admin_audit_log"("createdAt");

CREATE INDEX IF NOT EXISTS "admin_audit_log_actorId_createdAt_idx"
    ON "admin_audit_log"("actorId", "createdAt");

CREATE INDEX IF NOT EXISTS "admin_audit_log_entityType_createdAt_idx"
    ON "admin_audit_log"("entityType", "createdAt");
