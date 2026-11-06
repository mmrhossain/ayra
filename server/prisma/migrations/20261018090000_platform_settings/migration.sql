CREATE TABLE IF NOT EXISTS "platform_setting" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "isSecret" BOOLEAN NOT NULL DEFAULT false,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "platform_setting_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "platform_setting_key_key"
    ON "platform_setting"("key");

CREATE TABLE IF NOT EXISTS "platform_setting_audit" (
    "id" TEXT NOT NULL,
    "settingKey" TEXT NOT NULL,
    "changedBy" TEXT,
    "oldValue" JSONB,
    "newValue" JSONB,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "platform_setting_audit_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "platform_setting_audit_settingKey_changedAt_idx"
    ON "platform_setting_audit"("settingKey", "changedAt");
