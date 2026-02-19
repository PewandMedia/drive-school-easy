CREATE TABLE public.prices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  bezeichnung TEXT NOT NULL,
  kategorie TEXT NOT NULL,
  preis NUMERIC(10, 2) NOT NULL DEFAULT 0,
  einheit TEXT,
  aktiv BOOLEAN NOT NULL DEFAULT true
);

ALTER TABLE public.prices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view prices"
  ON public.prices FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert prices"
  ON public.prices FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update prices"
  ON public.prices FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete prices"
  ON public.prices FOR DELETE
  TO authenticated
  USING (true);
