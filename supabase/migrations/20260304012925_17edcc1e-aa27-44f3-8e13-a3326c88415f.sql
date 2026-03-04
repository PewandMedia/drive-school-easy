
-- 1. Update trigger: Fehlstunde = 40 EUR, 0 Einheiten
CREATE OR REPLACE FUNCTION public.calculate_driving_lesson_price()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.typ = 'fehlstunde' THEN
    NEW.preis := 40;
    NEW.einheiten := 0;
  ELSE
    NEW.preis := ROUND((NEW.dauer_minuten::numeric / 45) * 65, 2);
    NEW.einheiten := FLOOR(NEW.dauer_minuten / 45);
  END IF;
  RETURN NEW;
END;
$function$;

-- 2. Add datum column to services
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS datum timestamptz NOT NULL DEFAULT now();

-- 3. Update the open_item trigger for services to use datum instead of created_at
CREATE OR REPLACE FUNCTION public.create_open_item_for_service()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO open_items (student_id, typ, referenz_id, datum, beschreibung, betrag_gesamt)
  VALUES (
    NEW.student_id,
    'leistung',
    NEW.id,
    NEW.datum,
    NEW.bezeichnung,
    NEW.preis
  );
  RETURN NEW;
END;
$function$;
