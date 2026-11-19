BEGIN;

-- Allocate customer codes independently of orders and leave existing codes intact.
CREATE SEQUENCE public.customer_public_reference_seq
  AS BIGINT START WITH 1 INCREMENT BY 1 MINVALUE 1 NO CYCLE;

-- Preserve uniqueness if date-based customer codes already exist.
SELECT setval(
  'public.customer_public_reference_seq',
  COALESCE(MAX(substring("customerCode" FROM '^CUST-[0-9]{6}-([0-9]+)$')::BIGINT), 0) + 1,
  false
)
FROM public.customer_profile;

COMMIT;
