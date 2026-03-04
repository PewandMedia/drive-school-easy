CREATE OR REPLACE FUNCTION public.calculate_driving_lesson_price()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.typ = 'fehlstunde' THEN
    NEW.preis := COALESCE(NULLIF(NEW.preis, 0), 40);
    NEW.einheiten := 0;
  ELSE
    NEW.preis := ROUND((NEW.dauer_minuten::numeric / 45) * 65, 2);
    NEW.einheiten := FLOOR(NEW.dauer_minuten / 45);
  END IF;
  RETURN NEW;
END;
$function$;