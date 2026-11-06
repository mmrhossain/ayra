-- Better Auth 1.7.0 through 1.7.2 added a required "issuer" column and a
-- unique index on ("issuer", "accountId"). Better Auth 1.7.3+ no longer
-- writes "issuer" and recognizes accounts by ("providerId", "accountId")
-- again, so a NOT NULL "issuer" rejects every sign-up and account link.
--
-- Drop the index before relaxing the column, then leave "issuer" in place as
-- an optional column so historical rows keep their values. PostgreSQL keeps
-- an index after its column is altered, so this order is explicit.

DROP INDEX IF EXISTS "account_issuer_accountId_uidx";

ALTER TABLE "account" ALTER COLUMN "issuer" DROP NOT NULL;
