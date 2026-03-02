
Kurzdiagnose aus der aktuellen Analyse:
- `activity_log` ist aktuell komplett leer (`count = 0`), obwohl neue Fahrstunden vorhanden sind.
- Die Fahrstunden von 06:09 wurden in einer Dilan-Session erstellt, aber beim Admin-Info-Button kommt `[]` zurück.
- Damit ist die aktuelle clientseitige Protokollierung nicht zuverlässig genug für dein Ziel „immer sichtbar, wer es eingetragen hat“.

Um das dauerhaft und manipulationssicher zu lösen, setze ich auf serverseitiges Audit-Logging per DB-Trigger (statt nur Frontend-Aufruf).

Geplante Umsetzung:

1) Audit-Logging auf Datenbankebene erzwingen (wichtigster Fix)
- Neue Migration:
  - `activity_log` härten:
    - `user_id` auf `NOT NULL`
    - `entity_id` auf `NOT NULL`
    - optional FK `activity_log.user_id -> profiles.id`
    - optional Enum/Constraint für `action` (`erstellt|bearbeitet|geloescht`)
  - Trigger-Funktion erstellen, z. B. `public.audit_entity_change()`:
    - liest `auth.uid()` (aktueller User)
    - lädt Namen aus `profiles.display_name` (Fallback: E-Mail)
    - schreibt bei INSERT/UPDATE/DELETE automatisch in `activity_log`
  - Trigger auf alle relevanten Tabellen:
    - `driving_lessons`
    - `theory_sessions`
    - `exams`
    - `payments`
    - `services`
    - (Gutschriften laufen über `payments` mit negativem Betrag)
- Effekt: Jeder Eintrag wird zentral protokolliert, unabhängig davon, ob Frontend-Code gerade korrekt feuert.

2) Manipulationsschutz des Protokolls schließen
- RLS für `activity_log` finalisieren:
  - `SELECT` nur Admin
  - kein `UPDATE`, kein `DELETE` für App-User
  - direkte `INSERT` durch Clients entfernen/verbieten (nur Trigger schreibt)
- Dadurch kann niemand (auch Sekretärinnen nicht) das Protokoll bearbeiten oder fälschen.

3) Frontend von unsicherem Logging entkoppeln
- In den Seiten `Fahrstunden`, `Theorie`, `Pruefungen`, `Zahlungen`, `Leistungen` die direkten `logActivity(...)`-Aufrufe entfernen.
- Grund: sonst doppelte Einträge oder weiterhin Abhängigkeit vom Clientzustand.
- `src/lib/activityLog.ts` kann danach entfallen oder als Legacy markiert werden.

4) Info-Button exakt nach deinem gewünschten Format anzeigen
- `ActivityInfoButton` anpassen:
  - nicht nur „Liste aller Logs“, sondern gezielte Anzeige:
    - Eingetragen von: [Name]
    - Datum: [TT.MM.JJJJ]
    - Uhrzeit: [HH:MM]
    - Letzte Änderung: [Datum/Uhrzeit]
  - Datenlogik:
    - „Eingetragen von“ = ältester `erstellt`-Eintrag
    - „Letzte Änderung“ = neuester Logeintrag (egal ob bearbeitet/gelöscht)
- Admin-only Sichtbarkeit bleibt strikt (`isAdmin`).
- Zusätzlich: Refresh-Logik verbessern (bei Popover-Öffnen neu laden), damit nie ein alter Leerzustand gecacht bleibt.

5) Umgang mit bestehenden Alt-Daten (wichtig für Erwartungsmanagement)
- Bereits vorhandene Datensätze ohne Log können nicht sicher rückwirkend einem User zugeordnet werden.
- Ich baue deshalb:
  - ab jetzt 100% verlässliche Erfassung durch Trigger
  - optionalen Hinweis im Popup für Alt-Datensätze ohne Historie („Kein Protokoll vorhanden / vor Audit-Aktivierung“).

Technischer Scope (Dateien):
- Neu: `supabase/migrations/<timestamp>_audit_trigger_fix.sql`
- Ändern:
  - `src/components/ActivityInfoButton.tsx`
  - `src/pages/dashboard/Fahrstunden.tsx`
  - `src/pages/dashboard/Theorie.tsx`
  - `src/pages/dashboard/Pruefungen.tsx`
  - `src/pages/dashboard/Zahlungen.tsx`
  - `src/pages/dashboard/Leistungen.tsx`
  - optional `src/lib/activityLog.ts` (entfernen oder stilllegen)

Abnahmetest nach Umsetzung:
1. Mit Dilan eintragen (z. B. Fahrstunde).
2. Als Admin denselben Datensatz öffnen.
3. Popup muss zeigen:
   - Dilan als Eintragende
   - Datum/Uhrzeit
   - Letzte Änderung
4. Sekretärin darf den Info-Button nicht sehen.
5. Direkte Änderungen am `activity_log` durch Nicht-Admin dürfen nicht möglich sein.
