-- Bereinige falsche Einreichungsdaten: setze sie auf das tatsächliche Einnahmedatum
UPDATE public.payments SET einreichungsdatum = datum;

-- Entferne Default, damit künftig nur explizit gesetzte Werte gespeichert werden
ALTER TABLE public.payments ALTER COLUMN einreichungsdatum DROP DEFAULT;