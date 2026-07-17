## Fahrlehrer bei Schnellerfassung (Fahrstunde) verpflichtend

In `src/pages/dashboard/Schnellerfassung.tsx` im Fahrstunden-Block:

1. **Neuer State** `instructorId: string | null` (zusammen mit `studentId`, `einheiten`, `datum`).
2. **Neue Query** `instructors` (nur `aktiv = true`, sortiert Nachname), analog zur Combobox in `Fahrstunden.tsx`.
3. **Neues Select "Fahrlehrer"** direkt unter dem Fahrschüler-Feld — Optionen zeigen `Nachname, Vorname`.
4. **`saveLesson` mutation**: `instructor_id: null` → `instructor_id: instructorId` verwenden.
5. **Speichern-Button** ist disabled, solange `!studentId || !instructorId`.
6. **Reset nach Speichern**: `instructorId` bleibt „sticky" (analog zur bestehenden Konvention in `Fahrstunden.tsx`), damit man mehrere Stunden hintereinander schnell erfassen kann. `studentId` und `einheiten` werden wie bisher zurückgesetzt.
7. Toast-/Fehlermeldung falls Fahrlehrer fehlt.

Keine Änderungen an Fahrzeug, Typ, Preis-Logik, DB oder anderen Seiten.
