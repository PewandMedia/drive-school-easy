
CREATE OR REPLACE FUNCTION public.calculate_driving_lesson_price()
RETURNS TRIGGER AS $$
BEGIN
  NEW.preis := ROUND((NEW.dauer_minuten::numeric / 45) * 65, 2);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trg_calculate_driving_lesson_price
BEFORE INSERT OR UPDATE OF dauer_minuten ON public.driving_lessons
FOR EACH ROW
EXECUTE FUNCTION public.calculate_driving_lesson_price();
