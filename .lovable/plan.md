

## Fix: Aktivitaetsprotokoll funktioniert nicht

### Problem
Die `activity_log`-Tabelle ist leer. Kein einziger Log-Eintrag wurde geschrieben, obwohl `logActivity()` aufgerufen wird. Ursache: Die RLS-Policies auf `activity_log` sind als **RESTRICTIVE** erstellt. PostgreSQL erfordert mindestens eine **PERMISSIVE** Policy, damit ueberhaupt Zugriff gewaehrt wird. Restrictive Policies koennen nur zusaetzlich einschraenken.

Gleiches Problem besteht bei der `profiles`- und `user_roles`-Tabelle.

### Loesung

**1. Migration: RLS-Policies auf activity_log korrigieren**

Die bestehenden restrictive Policies loeschen und als permissive Policies neu erstellen:

- `activity_log`: INSERT fuer alle authenticated, SELECT nur fuer Admins
- `profiles`: SELECT/UPDATE/INSERT analog
- `user_roles`: SELECT/INSERT/UPDATE/DELETE analog

**2. Logging-Fehler sichtbar machen**

In `src/lib/activityLog.ts` den Fehler in der Konsole besser loggen, damit man Fehler sofort erkennt.

### Betroffene Dateien

| Datei | Aenderung |
|-------|-----------|
| Migration (SQL) | Alle restrictive Policies auf activity_log, profiles, user_roles loeschen und als permissive neu erstellen |
| `src/lib/activityLog.ts` | Fehler-Logging verbessern (optional) |

### SQL-Aenderungen (Migration)

```text
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
```

### Ergebnis

Nach der Migration werden alle Aktionen (Fahrstunde erstellen, loeschen, etc.) korrekt im Aktivitaetsprotokoll gespeichert. Der Info-Button zeigt dann "Eingetragen von: Dilan" mit Datum und Uhrzeit.

