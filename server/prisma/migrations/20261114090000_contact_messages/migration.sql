CREATE TYPE "ContactMessageStatus" AS ENUM ('NEW', 'READ', 'RESOLVED');

CREATE TABLE "contact_message" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" "ContactMessageStatus" NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contact_message_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "contact_message_status_createdAt_idx"
    ON "contact_message"("status", "createdAt");
