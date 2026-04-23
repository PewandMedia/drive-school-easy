ALTER TABLE public.payments
  ADD CONSTRAINT payments_instructor_id_fkey
  FOREIGN KEY (instructor_id) REFERENCES public.instructors(id) ON DELETE SET NULL;