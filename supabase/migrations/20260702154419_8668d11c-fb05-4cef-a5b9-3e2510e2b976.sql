ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS filiale text;
ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS payments_filiale_check;
ALTER TABLE public.payments ADD CONSTRAINT payments_filiale_check
  CHECK (filiale IN ('riemke','rathaus') OR filiale IS NULL);