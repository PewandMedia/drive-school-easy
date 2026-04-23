UPDATE public.payments 
SET einreichungsdatum = NULL 
WHERE einreichungsdatum = datum 
  AND created_at < '2026-04-23 16:00:00';