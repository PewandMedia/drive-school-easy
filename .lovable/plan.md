## Fahrlehrer automatisch aus letzter Fahrstunde des Schülers vorbelegen

In `src/pages/dashboard/Schnellerfassung.tsx`:

1. **Neue Query `lastInstructorByStudent`** — lädt aus `driving_lessons` pro Schüler den zuletzt verwendeten `instructor_id` (sortiert nach `datum` desc, `created_at` desc). Ergebnis wird als `Map<student_id, instructor_id>` bereitgestellt. Nutzt `fetchAllRows`, nur Felder `student_id, instructor_id, datum, created_at`, gefiltert auf `instructor_id not null`.

2. **Auto-Fill beim Schülerwechsel** — Wenn `studentId` gesetzt/geändert wird (via `onChange` der `StudentCombobox`) und für diesen Schüler eine `instructor_id` in der Map existiert, wird `stickyInstructor` automatisch auf diesen Wert gesetzt.
   - Wenn kein bisheriger Fahrlehrer bekannt ist → `stickyInstructor` bleibt wie vorher (sticky vom letzten Speichern).
   - Der Nutzer kann den vorgeschlagenen Fahrlehrer weiterhin manuell überschreiben.

3. **Keine Änderungen** an Speicherlogik, Pflicht-Validierung, DB-Schema, anderen Seiten oder am Fahrlehrer-Select selbst — nur die Vorbelegung wird intelligenter.

### Technische Details
- Query key: `["last-instructor-by-student"]`, `staleTime` moderat (z. B. 30 s), invalidiert nach erfolgreichem `saveLesson`, damit neue Zuordnungen sofort greifen.
- Map wird clientseitig aus dem sortierten Ergebnis gebaut: erster Treffer pro `student_id` gewinnt.
- Auto-Fill läuft in einem `handleStudentChange`-Callback, nicht in `useEffect`, damit die Sticky-Logik beim reinen Re-Render nicht überschrieben wird.
