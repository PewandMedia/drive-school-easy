
CREATE TABLE public.instructors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  vorname TEXT NOT NULL,
  nachname TEXT NOT NULL,
  email TEXT,
  telefon TEXT,
  aktiv BOOLEAN NOT NULL DEFAULT true
);

ALTER TABLE public.instructors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view instructors"
  ON public.instructors FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert instructors"
  ON public.instructors FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update instructors"
  ON public.instructors FOR UPDATE
  USING (true);

CREATE POLICY "Authenticated users can delete instructors"
  ON public.instructors FOR DELETE
  USING (true);
