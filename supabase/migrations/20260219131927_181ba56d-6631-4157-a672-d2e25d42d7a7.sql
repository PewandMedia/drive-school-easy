CREATE TYPE public.driving_lesson_typ AS ENUM (
  'uebungsstunde',
  'ueberland',
  'autobahn',
  'nacht',
  'fehlstunde',
  'testfahrt_b197'
);

CREATE TYPE public.fahrzeug_typ AS ENUM (
  'automatik',
  'schaltwagen'
);

CREATE TABLE public.driving_lessons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  typ public.driving_lesson_typ NOT NULL,
  dauer_minuten INTEGER NOT NULL DEFAULT 45,
  preis NUMERIC(10, 2) NOT NULL DEFAULT 0,
  fahrzeug_typ public.fahrzeug_typ NOT NULL DEFAULT 'automatik',
  datum TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.driving_lessons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view driving_lessons"
  ON public.driving_lessons FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert driving_lessons"
  ON public.driving_lessons FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update driving_lessons"
  ON public.driving_lessons FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete driving_lessons"
  ON public.driving_lessons FOR DELETE
  TO authenticated
  USING (true);
