-- Create enum for service status
CREATE TYPE public.service_status AS ENUM ('offen', 'bezahlt', 'erledigt');

-- Create services table
CREATE TABLE public.services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  preis_id UUID REFERENCES public.prices(id) ON DELETE SET NULL,
  bezeichnung TEXT NOT NULL,
  preis NUMERIC(10, 2) NOT NULL DEFAULT 0,
  status public.service_status NOT NULL DEFAULT 'offen'
);

ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view services"
  ON public.services FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert services"
  ON public.services FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update services"
  ON public.services FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete services"
  ON public.services FOR DELETE
  TO authenticated
  USING (true);
