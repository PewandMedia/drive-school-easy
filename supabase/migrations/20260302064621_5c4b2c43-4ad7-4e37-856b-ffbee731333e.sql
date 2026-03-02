
CREATE OR REPLACE FUNCTION public.audit_entity_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _user_id uuid;
  _user_name text;
  _action text;
  _entity_id uuid;
  _details text;
  _student_name text;
  _student_id uuid;
BEGIN
  _user_id := auth.uid();

  SELECT COALESCE(display_name, email, _user_id::text)
    INTO _user_name
    FROM public.profiles
    WHERE id = _user_id;

  IF _user_name IS NULL THEN
    _user_name := COALESCE(_user_id::text, 'system');
  END IF;

  IF TG_OP = 'INSERT' THEN
    _action := 'erstellt';
    _entity_id := NEW.id;
  ELSIF TG_OP = 'UPDATE' THEN
    _action := 'bearbeitet';
    _entity_id := NEW.id;
  ELSIF TG_OP = 'DELETE' THEN
    _action := 'geloescht';
    _entity_id := OLD.id;
  END IF;

  -- Build details based on table
  IF TG_TABLE_NAME = 'driving_lessons' THEN
    IF TG_OP = 'DELETE' THEN
      _student_id := OLD.student_id;
    ELSE
      _student_id := NEW.student_id;
    END IF;
    SELECT nachname || ', ' || vorname INTO _student_name FROM public.students WHERE id = _student_id;
    IF TG_OP = 'DELETE' THEN
      _details := initcap(OLD.typ::text) || ' fuer ' || COALESCE(_student_name, '?') || ' (' || OLD.dauer_minuten || ' Min)';
    ELSE
      _details := initcap(NEW.typ::text) || ' fuer ' || COALESCE(_student_name, '?') || ' (' || NEW.dauer_minuten || ' Min)';
    END IF;

  ELSIF TG_TABLE_NAME = 'theory_sessions' THEN
    IF TG_OP = 'DELETE' THEN
      _student_id := OLD.student_id;
    ELSE
      _student_id := NEW.student_id;
    END IF;
    SELECT nachname || ', ' || vorname INTO _student_name FROM public.students WHERE id = _student_id;
    IF TG_OP = 'DELETE' THEN
      _details := initcap(OLD.typ::text) || CASE WHEN OLD.lektion IS NOT NULL THEN ' Lektion ' || OLD.lektion ELSE '' END || ' fuer ' || COALESCE(_student_name, '?');
    ELSE
      _details := initcap(NEW.typ::text) || CASE WHEN NEW.lektion IS NOT NULL THEN ' Lektion ' || NEW.lektion ELSE '' END || ' fuer ' || COALESCE(_student_name, '?');
    END IF;

  ELSIF TG_TABLE_NAME = 'exams' THEN
    IF TG_OP = 'DELETE' THEN
      _student_id := OLD.student_id;
    ELSE
      _student_id := NEW.student_id;
    END IF;
    SELECT nachname || ', ' || vorname INTO _student_name FROM public.students WHERE id = _student_id;
    IF TG_OP = 'DELETE' THEN
      _details := CASE WHEN OLD.typ::text = 'theorie' THEN 'Theorieprüfung' ELSE 'Fahrprüfung' END || ' fuer ' || COALESCE(_student_name, '?');
    ELSE
      _details := CASE WHEN NEW.typ::text = 'theorie' THEN 'Theorieprüfung' ELSE 'Fahrprüfung' END || ' fuer ' || COALESCE(_student_name, '?');
    END IF;

  ELSIF TG_TABLE_NAME = 'payments' THEN
    IF TG_OP = 'DELETE' THEN
      _student_id := OLD.student_id;
    ELSE
      _student_id := NEW.student_id;
    END IF;
    SELECT nachname || ', ' || vorname INTO _student_name FROM public.students WHERE id = _student_id;
    IF TG_OP = 'DELETE' THEN
      _details := OLD.betrag || ' EUR (' || OLD.zahlungsart::text || ') fuer ' || COALESCE(_student_name, '?');
    ELSE
      _details := NEW.betrag || ' EUR (' || NEW.zahlungsart::text || ') fuer ' || COALESCE(_student_name, '?');
    END IF;

  ELSIF TG_TABLE_NAME = 'services' THEN
    IF TG_OP = 'DELETE' THEN
      _student_id := OLD.student_id;
    ELSE
      _student_id := NEW.student_id;
    END IF;
    SELECT nachname || ', ' || vorname INTO _student_name FROM public.students WHERE id = _student_id;
    IF TG_OP = 'DELETE' THEN
      _details := OLD.bezeichnung || ' (' || OLD.preis || ' EUR) fuer ' || COALESCE(_student_name, '?');
    ELSE
      _details := NEW.bezeichnung || ' (' || NEW.preis || ' EUR) fuer ' || COALESCE(_student_name, '?');
    END IF;

  ELSIF TG_TABLE_NAME = 'gear_lessons' THEN
    IF TG_OP = 'DELETE' THEN
      _student_id := OLD.student_id;
    ELSE
      _student_id := NEW.student_id;
    END IF;
    SELECT nachname || ', ' || vorname INTO _student_name FROM public.students WHERE id = _student_id;
    IF TG_OP = 'DELETE' THEN
      _details := 'Schaltstunde fuer ' || COALESCE(_student_name, '?') || ' (' || OLD.dauer_minuten || ' Min)';
    ELSE
      _details := 'Schaltstunde fuer ' || COALESCE(_student_name, '?') || ' (' || NEW.dauer_minuten || ' Min)';
    END IF;
  END IF;

  INSERT INTO public.activity_log (user_id, user_name, action, entity_type, entity_id, details)
  VALUES (_user_id, _user_name, _action, TG_TABLE_NAME, _entity_id, _details);

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$function$;
