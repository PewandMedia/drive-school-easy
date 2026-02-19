-- Create zahlungsart enum
CREATE TYPE public.zahlungsart_enum AS ENUM ('bar', 'ec', 'ueberweisung');

-- Create payments table
CREATE TABLE public.payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
  betrag NUMERIC NOT NULL DEFAULT 0,
  zahlungsart public.zahlungsart_enum NOT NULL DEFAULT 'bar',
  datum TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view payments"
  ON public.payments FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert payments"
  ON public.payments FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update payments"
  ON public.payments FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete payments"
  ON public.payments FOR DELETE TO authenticated USING (true);