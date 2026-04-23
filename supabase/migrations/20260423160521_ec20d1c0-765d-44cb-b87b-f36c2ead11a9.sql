ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS instructor_id uuid;

UPDATE public.payments SET einreichungsdatum = datum WHERE einreichungsdatum IS NULL;