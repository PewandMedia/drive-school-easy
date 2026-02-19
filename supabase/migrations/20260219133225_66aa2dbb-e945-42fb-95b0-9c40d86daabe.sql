
-- Enums erstellen
CREATE TYPE public.exam_typ AS ENUM ('theorie', 'praxis');

-- exams Tabelle
CREATE TABLE public.exams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  typ public.exam_typ NOT NULL,
  fahrzeug_typ public.fahrzeug_typ NOT NULL DEFAULT 'automatik',
  preis NUMERIC NOT NULL DEFAULT 0,
  datum TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  bestanden BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view exams"
  ON public.exams FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert exams"
  ON public.exams FOR INSERT WITH CHECK (true);

CREATE POLICY "Authenticated users can update exams"
  ON public.exams FOR UPDATE USING (true);

CREATE POLICY "Authenticated users can delete exams"
  ON public.exams FOR DELETE USING (true);
