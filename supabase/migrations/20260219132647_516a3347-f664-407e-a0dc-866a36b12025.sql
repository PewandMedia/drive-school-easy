-- Create enum for theory session types
CREATE TYPE public.theory_session_typ AS ENUM ('grundstoff', 'klassenspezifisch');

-- Create theory_sessions table
CREATE TABLE public.theory_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  typ public.theory_session_typ NOT NULL,
  datum TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.theory_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Authenticated users can view theory_sessions"
  ON public.theory_sessions FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert theory_sessions"
  ON public.theory_sessions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update theory_sessions"
  ON public.theory_sessions FOR UPDATE
  USING (true);

CREATE POLICY "Authenticated users can delete theory_sessions"
  ON public.theory_sessions FOR DELETE
  USING (true);