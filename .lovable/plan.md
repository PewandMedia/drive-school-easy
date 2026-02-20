

## Exams-Tabelle um instructor_id erweitern

### Datenbankaenderung

Neue Spalte `instructor_id` (UUID, nullable, FK -> instructors.id) in der `exams`-Tabelle. Ein Validierungs-Trigger stellt sicher, dass bei `typ = 'praxis'` ein Fahrlehrer angegeben wird.

### Migration (SQL)

1. Spalte hinzufuegen: `ALTER TABLE public.exams ADD COLUMN instructor_id UUID REFERENCES public.instructors(id)`
2. Validierungs-Trigger erstellen, der bei INSERT und UPDATE prueft:
   - Wenn `NEW.typ = 'praxis'` und `NEW.instructor_id IS NULL` -> Fehler ausloesen
   - Wenn `NEW.typ = 'theorie'` -> `NEW.instructor_id` auf NULL setzen (automatisch bereinigen)

Bestehende Daten bleiben unberuehrt (Spalte ist nullable, bestehende Praxis-Pruefungen behalten NULL bis sie aktualisiert werden).

### Code-Aenderungen

Keine Code-Aenderungen noetig -- die Spalte wird automatisch in den generierten Typen erscheinen. Die Pruefungen-Seite (`Pruefungen.tsx`) muss erst angepasst werden, wenn das Formular zum Erstellen/Bearbeiten von Pruefungen um ein Fahrlehrer-Dropdown erweitert wird (separater Schritt).

### Technische Details

- FK-Constraint: `exams.instructor_id -> instructors.id`
- Trigger-Funktion: `validate_exam_instructor()` als BEFORE INSERT OR UPDATE Trigger
- Bestehende Theorie-Pruefungen: instructor_id bleibt NULL (korrekt)
- Bestehende Praxis-Pruefungen: instructor_id bleibt NULL (Trigger greift nur bei neuen/aktualisierten Eintraegen)

