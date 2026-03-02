
-- =============================================
-- 1) Audit Trigger Function (SECURITY DEFINER)
-- =============================================
CREATE OR REPLACE FUNCTION public.audit_entity_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id uuid;
  _user_name text;
  _action text;
  _entity_id uuid;
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

  INSERT INTO public.activity_log (user_id, user_name, action, entity_type, entity_id)
  VALUES (_user_id, _user_name, _action, TG_TABLE_NAME, _entity_id);

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

-- =============================================
-- 2) Attach triggers to all relevant tables
-- =============================================
DROP TRIGGER IF EXISTS audit_driving_lessons ON driving_lessons;
CREATE TRIGGER audit_driving_lessons
  AFTER INSERT OR UPDATE OR DELETE ON driving_lessons
  FOR EACH ROW EXECUTE FUNCTION public.audit_entity_change();

DROP TRIGGER IF EXISTS audit_theory_sessions ON theory_sessions;
CREATE TRIGGER audit_theory_sessions
  AFTER INSERT OR UPDATE OR DELETE ON theory_sessions
  FOR EACH ROW EXECUTE FUNCTION public.audit_entity_change();

DROP TRIGGER IF EXISTS audit_exams ON exams;
CREATE TRIGGER audit_exams
  AFTER INSERT OR UPDATE OR DELETE ON exams
  FOR EACH ROW EXECUTE FUNCTION public.audit_entity_change();

DROP TRIGGER IF EXISTS audit_payments ON payments;
CREATE TRIGGER audit_payments
  AFTER INSERT OR UPDATE OR DELETE ON payments
  FOR EACH ROW EXECUTE FUNCTION public.audit_entity_change();

DROP TRIGGER IF EXISTS audit_services ON services;
CREATE TRIGGER audit_services
  AFTER INSERT OR UPDATE OR DELETE ON services
  FOR EACH ROW EXECUTE FUNCTION public.audit_entity_change();

-- =============================================
-- 3) Fix ALL restrictive policies -> permissive
-- =============================================

-- activity_log: remove old restrictive, add permissive
DROP POLICY IF EXISTS "Admins can view activity log" ON activity_log;
DROP POLICY IF EXISTS "Authenticated can insert activity log" ON activity_log;

CREATE POLICY "activity_log_select_admin"
  ON activity_log FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- No client INSERT needed anymore (trigger writes), but keep for backward compat
CREATE POLICY "activity_log_insert_authenticated"
  ON activity_log FOR INSERT TO authenticated
  WITH CHECK (true);

-- driving_lessons: fix restrictive
DROP POLICY IF EXISTS "Authenticated users can view driving_lessons" ON driving_lessons;
DROP POLICY IF EXISTS "Authenticated users can insert driving_lessons" ON driving_lessons;
DROP POLICY IF EXISTS "Authenticated users can update driving_lessons" ON driving_lessons;
DROP POLICY IF EXISTS "Authenticated users can delete driving_lessons" ON driving_lessons;

CREATE POLICY "driving_lessons_select" ON driving_lessons FOR SELECT TO authenticated USING (true);
CREATE POLICY "driving_lessons_insert" ON driving_lessons FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "driving_lessons_update" ON driving_lessons FOR UPDATE TO authenticated USING (true);
CREATE POLICY "driving_lessons_delete" ON driving_lessons FOR DELETE TO authenticated USING (true);

-- theory_sessions: fix restrictive
DROP POLICY IF EXISTS "Authenticated users can view theory_sessions" ON theory_sessions;
DROP POLICY IF EXISTS "Authenticated users can insert theory_sessions" ON theory_sessions;
DROP POLICY IF EXISTS "Authenticated users can update theory_sessions" ON theory_sessions;
DROP POLICY IF EXISTS "Authenticated users can delete theory_sessions" ON theory_sessions;

CREATE POLICY "theory_sessions_select" ON theory_sessions FOR SELECT TO authenticated USING (true);
CREATE POLICY "theory_sessions_insert" ON theory_sessions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "theory_sessions_update" ON theory_sessions FOR UPDATE TO authenticated USING (true);
CREATE POLICY "theory_sessions_delete" ON theory_sessions FOR DELETE TO authenticated USING (true);

-- exams: fix restrictive
DROP POLICY IF EXISTS "Authenticated users can view exams" ON exams;
DROP POLICY IF EXISTS "Authenticated users can insert exams" ON exams;
DROP POLICY IF EXISTS "Authenticated users can update exams" ON exams;
DROP POLICY IF EXISTS "Authenticated users can delete exams" ON exams;

CREATE POLICY "exams_select" ON exams FOR SELECT TO authenticated USING (true);
CREATE POLICY "exams_insert" ON exams FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "exams_update" ON exams FOR UPDATE TO authenticated USING (true);
CREATE POLICY "exams_delete" ON exams FOR DELETE TO authenticated USING (true);

-- payments: fix restrictive
DROP POLICY IF EXISTS "Authenticated users can view payments" ON payments;
DROP POLICY IF EXISTS "Authenticated users can insert payments" ON payments;
DROP POLICY IF EXISTS "Authenticated users can update payments" ON payments;
DROP POLICY IF EXISTS "Authenticated users can delete payments" ON payments;

CREATE POLICY "payments_select" ON payments FOR SELECT TO authenticated USING (true);
CREATE POLICY "payments_insert" ON payments FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "payments_update" ON payments FOR UPDATE TO authenticated USING (true);
CREATE POLICY "payments_delete" ON payments FOR DELETE TO authenticated USING (true);

-- services: fix restrictive
DROP POLICY IF EXISTS "Authenticated users can view services" ON services;
DROP POLICY IF EXISTS "Authenticated users can insert services" ON services;
DROP POLICY IF EXISTS "Authenticated users can update services" ON services;
DROP POLICY IF EXISTS "Authenticated users can delete services" ON services;

CREATE POLICY "services_select" ON services FOR SELECT TO authenticated USING (true);
CREATE POLICY "services_insert" ON services FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "services_update" ON services FOR UPDATE TO authenticated USING (true);
CREATE POLICY "services_delete" ON services FOR DELETE TO authenticated USING (true);

-- profiles: fix restrictive
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON profiles;

CREATE POLICY "profiles_select" ON profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "profiles_update" ON profiles FOR UPDATE TO authenticated
  USING (id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "profiles_insert" ON profiles FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- user_roles: fix restrictive
DROP POLICY IF EXISTS "Admins can view all roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can insert roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can update roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can delete roles" ON user_roles;

CREATE POLICY "user_roles_select" ON user_roles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR user_id = auth.uid());
CREATE POLICY "user_roles_insert" ON user_roles FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "user_roles_update" ON user_roles FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "user_roles_delete" ON user_roles FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- remaining tables: fix restrictive
DROP POLICY IF EXISTS "Authenticated users can view students" ON students;
DROP POLICY IF EXISTS "Authenticated users can insert students" ON students;
DROP POLICY IF EXISTS "Authenticated users can update students" ON students;
DROP POLICY IF EXISTS "Authenticated users can delete students" ON students;

CREATE POLICY "students_select" ON students FOR SELECT TO authenticated USING (true);
CREATE POLICY "students_insert" ON students FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "students_update" ON students FOR UPDATE TO authenticated USING (true);
CREATE POLICY "students_delete" ON students FOR DELETE TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated users can view instructors" ON instructors;
DROP POLICY IF EXISTS "Authenticated users can insert instructors" ON instructors;
DROP POLICY IF EXISTS "Authenticated users can update instructors" ON instructors;
DROP POLICY IF EXISTS "Authenticated users can delete instructors" ON instructors;

CREATE POLICY "instructors_select" ON instructors FOR SELECT TO authenticated USING (true);
CREATE POLICY "instructors_insert" ON instructors FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "instructors_update" ON instructors FOR UPDATE TO authenticated USING (true);
CREATE POLICY "instructors_delete" ON instructors FOR DELETE TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated users can view vehicles" ON vehicles;
DROP POLICY IF EXISTS "Authenticated users can insert vehicles" ON vehicles;
DROP POLICY IF EXISTS "Authenticated users can update vehicles" ON vehicles;
DROP POLICY IF EXISTS "Authenticated users can delete vehicles" ON vehicles;

CREATE POLICY "vehicles_select" ON vehicles FOR SELECT TO authenticated USING (true);
CREATE POLICY "vehicles_insert" ON vehicles FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "vehicles_update" ON vehicles FOR UPDATE TO authenticated USING (true);
CREATE POLICY "vehicles_delete" ON vehicles FOR DELETE TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated users can view prices" ON prices;
DROP POLICY IF EXISTS "Authenticated users can insert prices" ON prices;
DROP POLICY IF EXISTS "Authenticated users can update prices" ON prices;
DROP POLICY IF EXISTS "Authenticated users can delete prices" ON prices;

CREATE POLICY "prices_select" ON prices FOR SELECT TO authenticated USING (true);
CREATE POLICY "prices_insert" ON prices FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "prices_update" ON prices FOR UPDATE TO authenticated USING (true);
CREATE POLICY "prices_delete" ON prices FOR DELETE TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated users can view open_items" ON open_items;
DROP POLICY IF EXISTS "Authenticated users can insert open_items" ON open_items;
DROP POLICY IF EXISTS "Authenticated users can update open_items" ON open_items;
DROP POLICY IF EXISTS "Authenticated users can delete open_items" ON open_items;

CREATE POLICY "open_items_select" ON open_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "open_items_insert" ON open_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "open_items_update" ON open_items FOR UPDATE TO authenticated USING (true);
CREATE POLICY "open_items_delete" ON open_items FOR DELETE TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated users can view payment_allocations" ON payment_allocations;
DROP POLICY IF EXISTS "Authenticated users can insert payment_allocations" ON payment_allocations;
DROP POLICY IF EXISTS "Authenticated users can update payment_allocations" ON payment_allocations;
DROP POLICY IF EXISTS "Authenticated users can delete payment_allocations" ON payment_allocations;

CREATE POLICY "payment_allocations_select" ON payment_allocations FOR SELECT TO authenticated USING (true);
CREATE POLICY "payment_allocations_insert" ON payment_allocations FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "payment_allocations_update" ON payment_allocations FOR UPDATE TO authenticated USING (true);
CREATE POLICY "payment_allocations_delete" ON payment_allocations FOR DELETE TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated users can view gear_lessons" ON gear_lessons;
DROP POLICY IF EXISTS "Authenticated users can insert gear_lessons" ON gear_lessons;
DROP POLICY IF EXISTS "Authenticated users can update gear_lessons" ON gear_lessons;
DROP POLICY IF EXISTS "Authenticated users can delete gear_lessons" ON gear_lessons;

CREATE POLICY "gear_lessons_select" ON gear_lessons FOR SELECT TO authenticated USING (true);
CREATE POLICY "gear_lessons_insert" ON gear_lessons FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "gear_lessons_update" ON gear_lessons FOR UPDATE TO authenticated USING (true);
CREATE POLICY "gear_lessons_delete" ON gear_lessons FOR DELETE TO authenticated USING (true);
