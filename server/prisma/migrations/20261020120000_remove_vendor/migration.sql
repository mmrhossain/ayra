-- Single-vendor deployment: remove marketplace vendor leftovers.
-- This migration is intentionally not applied automatically by the agent.

-- Demote any legacy vendor accounts to customers before the profile table goes away.
UPDATE "user" SET "role" = 'CUSTOMER' WHERE upper("role") = 'VENDOR';

DROP TABLE IF EXISTS "vendor_profile" CASCADE;
