
CREATE TABLE public.gear_lessons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  datum TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  dauer_minuten INTEGER NOT NULL DEFAULT 45,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.gear_lessons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view gear_lessons"
  ON public.gear_lessons FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert gear_lessons"
  ON public.gear_lessons FOR INSERT WITH CHECK (true);

CREATE POLICY "Authenticated users can update gear_lessons"
  ON public.gear_lessons FOR UPDATE USING (true);

CREATE POLICY "Authenticated users can delete gear_lessons"
  ON public.gear_lessons FOR DELETE USING (true);
