
-- activity_log: Drop restrictive, create permissive
DROP POLICY "Admins can view activity log" ON activity_log;
DROP POLICY "Authenticated can insert activity log" ON activity_log;

CREATE POLICY "Admins can view activity log"
  ON activity_log FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated can insert activity log"
  ON activity_log FOR INSERT TO authenticated
  WITH CHECK (true);

-- profiles: Drop restrictive, create permissive
DROP POLICY "Users can view own profile" ON profiles;
DROP POLICY "Users can update own profile" ON profiles;
DROP POLICY "Admins can insert profiles" ON profiles;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE TO authenticated
  USING (id = auth.uid() OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert profiles"
  ON profiles FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin') OR id = auth.uid());

-- user_roles: Drop restrictive, create permissive
DROP POLICY "Admins can view all roles" ON user_roles;
DROP POLICY "Admins can insert roles" ON user_roles;
DROP POLICY "Admins can update roles" ON user_roles;
DROP POLICY "Admins can delete roles" ON user_roles;

CREATE POLICY "Admins can view all roles"
  ON user_roles FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin') OR user_id = auth.uid());

CREATE POLICY "Admins can insert roles"
  ON user_roles FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update roles"
  ON user_roles FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles"
  ON user_roles FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'));
