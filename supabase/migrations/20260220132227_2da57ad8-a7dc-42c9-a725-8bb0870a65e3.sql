
-- Add instructor_id column to exams
ALTER TABLE public.exams ADD COLUMN instructor_id UUID REFERENCES public.instructors(id);

-- Create validation trigger function
CREATE OR REPLACE FUNCTION public.validate_exam_instructor()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.typ = 'theorie' THEN
    NEW.instructor_id := NULL;
  ELSIF NEW.typ = 'praxis' AND NEW.instructor_id IS NULL THEN
    RAISE EXCEPTION 'Praxisprüfungen benötigen einen Fahrlehrer (instructor_id)';
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger
CREATE TRIGGER validate_exam_instructor_trigger
BEFORE INSERT OR UPDATE ON public.exams
FOR EACH ROW
EXECUTE FUNCTION public.validate_exam_instructor();
