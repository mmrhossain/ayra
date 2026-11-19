BEGIN;

-- Only future references change. Preserve existing records and sequence counters.
CREATE FUNCTION public.format_decimal_reference(reference BIGINT)
RETURNS TEXT LANGUAGE SQL IMMUTABLE STRICT AS $$
  SELECT lpad(reference::text, GREATEST(3, length(reference::text)), '0');
$$;

ALTER TABLE public."order"
  ALTER COLUMN "invoiceNumber" SET DEFAULT (
    'INV-' || to_char(CURRENT_TIMESTAMP AT TIME ZONE 'UTC', 'YYYY') || '-' ||
    public.format_decimal_reference(nextval('public.invoice_public_reference_seq'))
  ),
  DROP CONSTRAINT "order_invoiceNumber_format_check",
  ADD CONSTRAINT "order_invoiceNumber_format_check"
    CHECK ("invoiceNumber" ~ '^INV-[0-9]{4}-([0-9]{3,}|[0-9A-Z]{6})$');

ALTER TABLE public.payment
  ALTER COLUMN "paymentNumber" SET DEFAULT (
    'PAY-' || to_char(CURRENT_TIMESTAMP AT TIME ZONE 'UTC', 'YYMMDD') || '-' ||
    public.format_decimal_reference(nextval('public.payment_public_reference_seq'))
  ),
  DROP CONSTRAINT "payment_paymentNumber_format_check",
  ADD CONSTRAINT "payment_paymentNumber_format_check"
    CHECK ("paymentNumber" ~ '^PAY-[0-9]{6}-([0-9]{3,}|[0-9A-Z]{8})$');

ALTER TABLE public.refund
  ALTER COLUMN "refundNumber" SET DEFAULT (
    'REF-' || to_char(CURRENT_TIMESTAMP AT TIME ZONE 'UTC', 'YYMMDD') || '-' ||
    public.format_decimal_reference(nextval('public.refund_public_reference_seq'))
  ),
  DROP CONSTRAINT "refund_refundNumber_format_check",
  ADD CONSTRAINT "refund_refundNumber_format_check"
    CHECK ("refundNumber" ~ '^REF-[0-9]{6}-([0-9]{3,}|[0-9A-Z]{8})$');

COMMIT;
