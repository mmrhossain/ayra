BEGIN;

CREATE SEQUENCE public.order_public_reference_seq
  AS BIGINT START WITH 1 INCREMENT BY 1 MINVALUE 1 MAXVALUE 2176782335 NO CYCLE;
CREATE SEQUENCE public.invoice_public_reference_seq
  AS BIGINT START WITH 1 INCREMENT BY 1 MINVALUE 1 MAXVALUE 2176782335 NO CYCLE;
CREATE SEQUENCE public.payment_public_reference_seq
  AS BIGINT START WITH 1 INCREMENT BY 1 MINVALUE 1 MAXVALUE 2821109907455 NO CYCLE;
CREATE SEQUENCE public.refund_public_reference_seq
  AS BIGINT START WITH 1 INCREMENT BY 1 MINVALUE 1 MAXVALUE 2821109907455 NO CYCLE;

CREATE FUNCTION public.encode_base36(reference BIGINT, width INTEGER)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
STRICT
AS $$
DECLARE
  alphabet CONSTANT TEXT := '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  remaining BIGINT := reference;
  encoded TEXT := '';
BEGIN
  IF reference < 0 OR width < 1 OR reference >= power(36::NUMERIC, width) THEN
    RAISE EXCEPTION 'Base36 reference does not fit width %', width;
  END IF;
  WHILE remaining > 0 LOOP
    encoded := substr(alphabet, (remaining % 36)::INTEGER + 1, 1) || encoded;
    remaining := remaining / 36;
  END LOOP;
  RETURN lpad(encoded, width, '0');
END
$$;

CREATE FUNCTION public.decode_base36(encoded TEXT)
RETURNS BIGINT
LANGUAGE plpgsql
IMMUTABLE
STRICT
AS $$
DECLARE
  alphabet CONSTANT TEXT := '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  result BIGINT := 0;
  character TEXT;
  digit INTEGER;
  index INTEGER;
BEGIN
  FOR index IN 1..length(encoded) LOOP
    character := upper(substr(encoded, index, 1));
    digit := strpos(alphabet, character) - 1;
    IF digit < 0 THEN
      RAISE EXCEPTION 'Invalid base36 reference';
    END IF;
    result := result * 36 + digit;
  END LOOP;
  RETURN result;
END
$$;

ALTER TABLE public."order" ADD COLUMN "invoiceNumber" TEXT;
ALTER TABLE public.payment ADD COLUMN "paymentNumber" TEXT;
ALTER TABLE public.refund ADD COLUMN "refundNumber" TEXT;

DO $$
BEGIN
  IF (SELECT COUNT(*) FROM public."order") > 2176782335 THEN
    RAISE EXCEPTION 'Cannot backfill invoice references: reference capacity exceeded';
  END IF;
  IF (SELECT COUNT(*) FROM public.payment) > 2821109907455 THEN
    RAISE EXCEPTION 'Cannot backfill payment references: reference capacity exceeded';
  END IF;
  IF (SELECT COUNT(*) FROM public.refund) > 2821109907455 THEN
    RAISE EXCEPTION 'Cannot backfill refund references: reference capacity exceeded';
  END IF;
END
$$;

UPDATE public."order" AS o
SET "invoiceNumber" =
  'INV-' || to_char(o."createdAt", 'YYYY') || '-' ||
  public.encode_base36(nextval('public.invoice_public_reference_seq'), 6);

UPDATE public.payment AS p
SET "paymentNumber" =
  'PAY-' || to_char(p."createdAt", 'YYMMDD') || '-' ||
  public.encode_base36(nextval('public.payment_public_reference_seq'), 8);

UPDATE public.refund AS r
SET "refundNumber" =
  'REF-' || to_char(r."createdAt", 'YYMMDD') || '-' ||
  public.encode_base36(nextval('public.refund_public_reference_seq'), 8);

ALTER TABLE public."order"
  ALTER COLUMN "invoiceNumber" SET DEFAULT (
    'INV-' || to_char(CURRENT_TIMESTAMP AT TIME ZONE 'UTC', 'YYYY') || '-' ||
    public.encode_base36(nextval('public.invoice_public_reference_seq'), 6)
  ),
  ALTER COLUMN "invoiceNumber" SET NOT NULL;
ALTER TABLE public.payment
  ALTER COLUMN "paymentNumber" SET DEFAULT (
    'PAY-' || to_char(CURRENT_TIMESTAMP AT TIME ZONE 'UTC', 'YYMMDD') || '-' ||
    public.encode_base36(nextval('public.payment_public_reference_seq'), 8)
  ),
  ALTER COLUMN "paymentNumber" SET NOT NULL;
ALTER TABLE public.refund
  ALTER COLUMN "refundNumber" SET DEFAULT (
    'REF-' || to_char(CURRENT_TIMESTAMP AT TIME ZONE 'UTC', 'YYMMDD') || '-' ||
    public.encode_base36(nextval('public.refund_public_reference_seq'), 8)
  ),
  ALTER COLUMN "refundNumber" SET NOT NULL;
CREATE UNIQUE INDEX "order_invoiceNumber_key"
  ON public."order"("invoiceNumber");
CREATE UNIQUE INDEX "payment_paymentNumber_key"
  ON public.payment("paymentNumber");
CREATE UNIQUE INDEX "refund_refundNumber_key"
  ON public.refund("refundNumber");

ALTER TABLE public."order"
  ADD CONSTRAINT "order_invoiceNumber_format_check"
  CHECK ("invoiceNumber" ~ '^INV-[0-9]{4}-[0-9A-Z]{6}$');
ALTER TABLE public.payment
  ADD CONSTRAINT "payment_paymentNumber_format_check"
  CHECK ("paymentNumber" ~ '^PAY-[0-9]{6}-[0-9A-Z]{8}$');
ALTER TABLE public.refund
  ADD CONSTRAINT "refund_refundNumber_format_check"
  CHECK ("refundNumber" ~ '^REF-[0-9]{6}-[0-9A-Z]{8}$');

SELECT setval(
  'public.order_public_reference_seq',
  GREATEST(
    COALESCE(MAX(public.decode_base36((regexp_match(o."orderNumber", '^AYR-[0-9]{6}-([0-9A-Z]{6})$'))[1])), 1),
    1
  ),
  COUNT(*) > 0
)
FROM public."order" AS o
WHERE o."orderNumber" ~ '^AYR-[0-9]{6}-[0-9A-Z]{6}$';

COMMIT;

