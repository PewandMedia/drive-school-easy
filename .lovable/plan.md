

## Fahrlehrer-Feld fuer Theoriestunden

### Uebersicht

Die `theory_sessions`-Tabelle bekommt eine neue Spalte `instructor_id`, und beide Theorie-Formulare (Hauptseite Theorie + Schuelerprofil) werden um ein Fahrlehrer-Dropdown erweitert. Im Schuelerprofil wird der Fahrlehrer bei jeder Lektion in der Checkliste bzw. Liste angezeigt.

### Aenderungen

**1. Datenbank-Migration**

```sql
ALTER TABLE theory_sessions
  ADD COLUMN instructor_id uuid REFERENCES instructors(id);
```

Nullable, damit bestehende Eintraege ohne Fahrlehrer bestehen bleiben.

**2. Datei: `src/pages/dashboard/Theorie.tsx`**

- Instructors-Query hinzufuegen (aktive Fahrlehrer laden)
- `TheorySession`-Typ um `instructor_id` erweitern
- `defaultForm` um `instructor_id: ""` erweitern
- Query: `instructor_id` mitlesen
- Im Formular: Neues Select-Feld "Fahrlehrer" (Pflichtfeld)
- Validierung: Ohne Fahrlehrer kein Speichern
- Insert-Mutation: `instructor_id` mitsenden
- Tabelle: Neue Spalte "Fahrlehrer" anzeigen (Name aus instructorMap)

**3. Datei: `src/pages/dashboard/FahrschuelerDetail.tsx`**

- `fsTheorie`-State um `instructor_id: ""` erweitern
- Im Theorie-Dialog: Select-Feld "Fahrlehrer" hinzufuegen (Instructors sind bereits geladen)
- Validierung: Pflichtfeld
- Insert-Mutation: `instructor_id` mitsenden
- Reset beim Schliessen anpassen
- Theorie-Liste / Lektionen-Checkliste: Fahrlehrer-Name anzeigen (z.B. als Tooltip oder kleiner Text neben der Lektion)

### Betroffene Dateien

| Datei | Aenderung |
|-------|-----------|
| Migration (SQL) | `instructor_id` Spalte in `theory_sessions` |
| `src/pages/dashboard/Theorie.tsx` | Fahrlehrer-Dropdown im Formular, Spalte in Tabelle |
| `src/pages/dashboard/FahrschuelerDetail.tsx` | Fahrlehrer-Dropdown im Dialog, Anzeige bei Lektionen |

