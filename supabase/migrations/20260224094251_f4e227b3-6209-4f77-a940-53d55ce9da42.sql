
-- ============================================================
-- 1. Tabelle: open_items
-- ============================================================
CREATE TABLE public.open_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  typ text NOT NULL,
  referenz_id uuid NOT NULL,
  datum timestamptz NOT NULL DEFAULT now(),
  beschreibung text NOT NULL,
  betrag_gesamt numeric NOT NULL,
  betrag_bezahlt numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'offen',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.open_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view open_items" ON public.open_items FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert open_items" ON public.open_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can update open_items" ON public.open_items FOR UPDATE USING (true);
CREATE POLICY "Authenticated users can delete open_items" ON public.open_items FOR DELETE USING (true);

-- ============================================================
-- 2. Tabelle: payment_allocations
-- ============================================================
CREATE TABLE public.payment_allocations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  payment_id uuid NOT NULL REFERENCES public.payments(id) ON DELETE CASCADE,
  open_item_id uuid NOT NULL REFERENCES public.open_items(id) ON DELETE CASCADE,
  betrag numeric NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.payment_allocations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view payment_allocations" ON public.payment_allocations FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert payment_allocations" ON public.payment_allocations FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can update payment_allocations" ON public.payment_allocations FOR UPDATE USING (true);
CREATE POLICY "Authenticated users can delete payment_allocations" ON public.payment_allocations FOR DELETE USING (true);

-- ============================================================
-- 3. Trigger: open_item nach driving_lessons INSERT
-- ============================================================
CREATE OR REPLACE FUNCTION public.create_open_item_for_driving_lesson()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO open_items (student_id, typ, referenz_id, datum, beschreibung, betrag_gesamt)
  VALUES (
    NEW.student_id,
    'fahrstunde',
    NEW.id,
    NEW.datum,
    'Fahrstunde ' || NEW.dauer_minuten || 'min (' || NEW.einheiten || 'E)',
    NEW.preis
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_open_item_driving_lesson
AFTER INSERT ON public.driving_lessons
FOR EACH ROW
EXECUTE FUNCTION public.create_open_item_for_driving_lesson();

-- ============================================================
-- 4. Trigger: open_item nach exams INSERT
-- ============================================================
CREATE OR REPLACE FUNCTION public.create_open_item_for_exam()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO open_items (student_id, typ, referenz_id, datum, beschreibung, betrag_gesamt)
  VALUES (
    NEW.student_id,
    'pruefung',
    NEW.id,
    NEW.datum,
    CASE WHEN NEW.typ = 'theorie' THEN 'Theorieprüfung' ELSE 'Fahrprüfung' END,
    NEW.preis
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_open_item_exam
AFTER INSERT ON public.exams
FOR EACH ROW
EXECUTE FUNCTION public.create_open_item_for_exam();

-- ============================================================
-- 5. Trigger: open_item nach services INSERT
-- ============================================================
CREATE OR REPLACE FUNCTION public.create_open_item_for_service()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO open_items (student_id, typ, referenz_id, datum, beschreibung, betrag_gesamt)
  VALUES (
    NEW.student_id,
    'leistung',
    NEW.id,
    NEW.created_at,
    NEW.bezeichnung,
    NEW.preis
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_open_item_service
AFTER INSERT ON public.services
FOR EACH ROW
EXECUTE FUNCTION public.create_open_item_for_service();

-- ============================================================
-- 6. Trigger: open_item Status nach payment_allocations INSERT
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_open_item_after_allocation()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  total_paid numeric;
  item_total numeric;
BEGIN
  SELECT COALESCE(SUM(betrag), 0) INTO total_paid
  FROM payment_allocations WHERE open_item_id = NEW.open_item_id;

  SELECT betrag_gesamt INTO item_total
  FROM open_items WHERE id = NEW.open_item_id;

  UPDATE open_items SET
    betrag_bezahlt = total_paid,
    status = CASE
      WHEN total_paid >= item_total THEN 'bezahlt'
      WHEN total_paid > 0 THEN 'teilbezahlt'
      ELSE 'offen'
    END
  WHERE id = NEW.open_item_id;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_update_open_item_after_allocation
AFTER INSERT ON public.payment_allocations
FOR EACH ROW
EXECUTE FUNCTION public.update_open_item_after_allocation();

-- ============================================================
-- 7. Bestehende Daten migrieren
-- ============================================================

-- Fahrstunden
INSERT INTO open_items (student_id, typ, referenz_id, datum, beschreibung, betrag_gesamt)
SELECT student_id, 'fahrstunde', id, datum,
  'Fahrstunde ' || dauer_minuten || 'min (' || einheiten || 'E)',
  preis
FROM driving_lessons;

-- Prüfungen
INSERT INTO open_items (student_id, typ, referenz_id, datum, beschreibung, betrag_gesamt)
SELECT student_id, 'pruefung', id, datum,
  CASE WHEN typ = 'theorie' THEN 'Theorieprüfung' ELSE 'Fahrprüfung' END,
  preis
FROM exams;

-- Leistungen
INSERT INTO open_items (student_id, typ, referenz_id, datum, beschreibung, betrag_gesamt)
SELECT student_id, 'leistung', id, created_at, bezeichnung, preis
FROM services;
