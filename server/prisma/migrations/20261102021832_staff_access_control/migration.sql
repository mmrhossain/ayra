-- Staff access control: explicit super-admin flag, lifecycle, invitations,
-- action-level permissions and richer audit records.

-- CreateEnum
CREATE TYPE "StaffStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'OFFBOARDED');

-- CreateEnum
CREATE TYPE "StaffInvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REVOKED', 'EXPIRED');

-- AlterTable
ALTER TABLE "admin_audit_log" ADD COLUMN     "action" TEXT,
ADD COLUMN     "outcome" TEXT NOT NULL DEFAULT 'SUCCESS',
ADD COLUMN     "source" TEXT NOT NULL DEFAULT 'APP';

-- AlterTable
ALTER TABLE "refund" ADD COLUMN     "approvedBy" TEXT,
ADD COLUMN     "completedBy" TEXT,
ADD COLUMN     "requestedBy" TEXT;

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "adminActions" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "isSuperAdmin" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "staffStatus" "StaffStatus" NOT NULL DEFAULT 'ACTIVE';

-- CreateTable
CREATE TABLE "staff_invitation" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "permissions" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "isSuperAdmin" BOOLEAN NOT NULL DEFAULT false,
    "tokenHash" TEXT NOT NULL,
    "status" "StaffInvitationStatus" NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "invitedById" TEXT NOT NULL,
    "acceptedById" TEXT,
    "acceptedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "revokedById" TEXT,
    "lastSentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "staff_invitation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "staff_invitation_tokenHash_key" ON "staff_invitation"("tokenHash");

-- CreateIndex
CREATE INDEX "staff_invitation_email_status_idx" ON "staff_invitation"("email", "status");

-- CreateIndex
CREATE INDEX "staff_invitation_status_expiresAt_idx" ON "staff_invitation"("status", "expiresAt");

-- CreateIndex
CREATE INDEX "admin_audit_log_action_createdAt_idx" ON "admin_audit_log"("action", "createdAt");

-- CreateIndex
CREATE INDEX "user_role_isSuperAdmin_staffStatus_idx" ON "user"("role", "isSuperAdmin", "staffStatus");

-- AddForeignKey
ALTER TABLE "staff_invitation" ADD CONSTRAINT "staff_invitation_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_invitation" ADD CONSTRAINT "staff_invitation_acceptedById_fkey" FOREIGN KEY ("acceptedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Data migration: the previous model treated an ADMIN with an empty scope list
-- as a full-access administrator. Preserve those accounts explicitly so the
-- new "empty means no access" rule does not lock anyone out.
UPDATE "user"
SET "isSuperAdmin" = true
WHERE lower("role") = 'admin'
  AND "isSuperAdmin" = false
  AND coalesce(array_length("adminPermissions", 1), 0) = 0;

-- Audit rows are append-only. Block UPDATE/DELETE at the database level so a
-- compromised application credential cannot rewrite history.
CREATE OR REPLACE FUNCTION "admin_audit_log_immutable"()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'admin_audit_log is append-only';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS "admin_audit_log_no_update_delete" ON "admin_audit_log";
CREATE TRIGGER "admin_audit_log_no_update_delete"
    BEFORE UPDATE OR DELETE ON "admin_audit_log"
    FOR EACH ROW EXECUTE FUNCTION "admin_audit_log_immutable"();
