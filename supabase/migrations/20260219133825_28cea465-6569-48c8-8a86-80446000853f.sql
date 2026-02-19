-- Create vehicles table
CREATE TABLE public.vehicles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bezeichnung TEXT NOT NULL,
  typ public.fahrzeug_typ NOT NULL DEFAULT 'automatik',
  kennzeichen TEXT NOT NULL DEFAULT '',
  aktiv BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Authenticated users can view vehicles"
  ON public.vehicles FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert vehicles"
  ON public.vehicles FOR INSERT
  TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update vehicles"
  ON public.vehicles FOR UPDATE
  TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete vehicles"
  ON public.vehicles FOR DELETE
  TO authenticated USING (true);