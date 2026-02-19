-- Create enum for driving license class
CREATE TYPE public.fuehrerscheinklasse_enum AS ENUM ('B', 'B78', 'B197');

-- Create students table
CREATE TABLE public.students (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  vorname TEXT NOT NULL,
  nachname TEXT NOT NULL,
  telefon TEXT,
  email TEXT,
  adresse TEXT,
  fuehrerscheinklasse public.fuehrerscheinklasse_enum NOT NULL,
  ist_umschreiber BOOLEAN NOT NULL DEFAULT false,
  status TEXT
);

-- Enable Row Level Security
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users full access
CREATE POLICY "Authenticated users can view students"
  ON public.students FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert students"
  ON public.students FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update students"
  ON public.students FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete students"
  ON public.students FOR DELETE
  TO authenticated
  USING (true);
