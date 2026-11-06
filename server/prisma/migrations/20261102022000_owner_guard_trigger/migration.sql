-- Database-level protection for the last active super admin.
--
-- Application code, Better Auth hooks and ad-hoc SQL can all demote, suspend,
-- ban, delete or soft-delete a user. A count-then-write check in the service
-- layer is racy across concurrent requests, so the invariant is enforced where
-- it is atomic: a row-level trigger that runs inside the mutating transaction.
--
-- The trigger takes a transaction-scoped advisory lock. Concurrent mutations
-- that would each remove a different owner therefore serialize, and the second
-- one observes the post-commit state instead of a stale snapshot.

CREATE OR REPLACE FUNCTION "user_last_super_admin_guard"()
RETURNS TRIGGER AS $$
DECLARE
    remaining INTEGER;
BEGIN
    -- Only act when this row stops being an active super admin.
    IF NOT (
        OLD."isSuperAdmin" = true
        AND lower(OLD."role") = 'admin'
        AND OLD."staffStatus" = 'ACTIVE'
        AND COALESCE(OLD."banned", false) = false
        AND OLD."deletedAt" IS NULL
    ) THEN
        RETURN COALESCE(NEW, OLD);
    END IF;

    IF TG_OP = 'UPDATE' THEN
        IF NEW."isSuperAdmin" = true
           AND lower(NEW."role") = 'admin'
           AND NEW."staffStatus" = 'ACTIVE'
           AND COALESCE(NEW."banned", false) = false
           AND NEW."deletedAt" IS NULL THEN
            RETURN NEW;
        END IF;
    END IF;

    -- Serialize all owner-removing transactions.
    PERFORM pg_advisory_xact_lock(4706773726645583461::bigint);

    SELECT COUNT(*) INTO remaining
    FROM "user"
    WHERE "id" <> OLD."id"
      AND "isSuperAdmin" = true
      AND lower("role") = 'admin'
      AND "staffStatus" = 'ACTIVE'
      AND COALESCE("banned", false) = false
      AND "deletedAt" IS NULL;

    IF remaining = 0 THEN
        RAISE EXCEPTION 'at least one active super admin must remain'
            USING ERRCODE = 'check_violation';
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS "user_last_super_admin_guard" ON "user";
CREATE TRIGGER "user_last_super_admin_guard"
    BEFORE UPDATE OF "isSuperAdmin", "role", "staffStatus", "banned", "deletedAt"
    OR DELETE ON "user"
    FOR EACH ROW EXECUTE FUNCTION "user_last_super_admin_guard"();
