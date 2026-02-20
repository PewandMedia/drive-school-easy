
-- 1. Add einheiten column
ALTER TABLE public.driving_lessons ADD COLUMN einheiten integer NOT NULL DEFAULT 1;

-- 2. Backfill existing data
UPDATE public.driving_lessons SET einheiten = FLOOR(dauer_minuten / 45);

-- 3. Extend existing trigger to also calculate einheiten
CREATE OR REPLACE FUNCTION public.calculate_driving_lesson_price()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  NEW.preis := ROUND((NEW.dauer_minuten::numeric / 45) * 65, 2);
  NEW.einheiten := FLOOR(NEW.dauer_minuten / 45);
  RETURN NEW;
END;
$function$;

-- 4. Ensure trigger exists on the table
DROP TRIGGER IF EXISTS calculate_driving_lesson_price ON public.driving_lessons;
CREATE TRIGGER calculate_driving_lesson_price
  BEFORE INSERT OR UPDATE ON public.driving_lessons
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_driving_lesson_price();
