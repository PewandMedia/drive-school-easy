

## Fahrlehrer-Feld fuer Fahrstunden

### Uebersicht

Die `driving_lessons`-Tabelle bekommt eine neue Spalte `instructor_id`, und beide Fahrstunden-Formulare (Hauptseite + Schuelerprofil) werden um ein Fahrlehrer-Dropdown erweitert. Im Schuelerprofil wird der zugewiesene Fahrlehrer bei jeder Fahrstunde angezeigt.

### Aenderungen

**1. Datenbank-Migration**

Neue Spalte `instructor_id` (UUID, nullable, FK auf `instructors.id`) in der Tabelle `driving_lessons`. Nullable, damit bestehende Eintraege ohne Fahrlehrer bestehen bleiben.

```sql
ALTER TABLE driving_lessons
  ADD COLUMN instructor_id uuid REFERENCES instructors(id);
```

**2. Datei: `src/pages/dashboard/Fahrstunden.tsx`**

- Instructors-Query hinzufuegen (aktive Fahrlehrer laden)
- `defaultForm` um `instructor_id: ""` erweitern
- Im Formular: Neues Select-Feld "Fahrlehrer" (Pflichtfeld, nach Schueler-Auswahl)
- Validierung: Ohne Fahrlehrer kein Speichern
- Insert-Mutation: `instructor_id` mitsenden
- `DrivingLesson`-Typ um `instructor_id` erweitern
- Tabelle: Neue Spalte "Fahrlehrer" anzeigen (Name aus instructorMap)
- Instructor-Map (id -> Name) fuer die Anzeige

**3. Datei: `src/pages/dashboard/FahrschuelerDetail.tsx`**

- `fsFahrstunde`-State um `instructor_id: ""` erweitern
- Im Fahrstunden-Dialog: Select-Feld "Fahrlehrer" hinzufuegen (Instructors sind bereits geladen via `instructors`-Query)
- Validierung: Pflichtfeld
- Insert-Mutation: `instructor_id` mitsenden
- Reset beim Schliessen anpassen
- Fahrstunden-Liste: Fahrlehrer-Name neben Datum/Dauer anzeigen (z.B. "· Fahrlehrer: Max Mustermann")

### Betroffene Dateien

| Datei | Aenderung |
|-------|-----------|
| Migration (SQL) | `instructor_id` Spalte in `driving_lessons` |
| `src/pages/dashboard/Fahrstunden.tsx` | Fahrlehrer-Dropdown im Formular, Spalte in Tabelle, Validierung |
| `src/pages/dashboard/FahrschuelerDetail.tsx` | Fahrlehrer-Dropdown im Dialog, Anzeige in Fahrstunden-Liste |

