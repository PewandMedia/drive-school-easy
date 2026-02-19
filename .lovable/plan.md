
## Schaltstunden-Seite vollständig implementieren

### Problem

Die Seite `/dashboard/schaltstunden` ist ein reiner Platzhalter. Der „+ Stunde planen"-Button öffnet keinen Dialog – es existiert keinerlei Funktionalität zum Erfassen, Anzeigen oder Löschen von Schaltstunden.

### Datenbankstruktur `gear_lessons`

Die Tabelle hat folgende Spalten:
- `id` (uuid)
- `student_id` (uuid)
- `datum` (timestamptz)
- `dauer_minuten` (integer)
- `created_at` (timestamptz)

Kein `vehicle_id`-Feld vorhanden – die Fahrzeugspalte in der bestehenden Tabellenkopfzeile war ein Platzhalterkonzept und wird durch eine vereinfachtere Ansicht ersetzt.

### Geplante Implementierung

Die Seite `Schaltstunden.tsx` wird vollständig neu gebaut – analog zu `Fahrstunden.tsx` – mit folgenden Elementen:

#### 1. Dialog „Stunde planen"

Felder im Formular:
- **Schüler** – Select aus `students` (nur B197-Schüler würden gefiltert werden, aber für Flexibilität alle zeigen)
- **Datum & Uhrzeit** – `datetime-local` Input, Standardwert = jetzt
- **Dauer** – Schnellauswahl: 45 / 90 / 135 min + freies Eingabefeld

#### 2. Statistik-Karten (oben)

3 Karten:
- Schaltstunden gesamt (Anzahl Einträge)
- Schüler mit ≥ 10 Stunden (abgeschlossen)
- Ø Dauer (Minuten)

#### 3. Tabelle

Spalten:
- Schüler
- Datum
- Dauer (min)
- Einheit (Stunden-Nummer dieses Schülers, z.B. „3. Stunde")
- Löschen-Button

Die Tabelle wird nach Datum absteigend sortiert.

#### 4. Mutations

- **Insert**: `supabase.from("gear_lessons").insert({ student_id, datum, dauer_minuten })`
- **Delete**: `supabase.from("gear_lessons").delete().eq("id", id)`
- Nach jeder Mutation: `queryClient.invalidateQueries(["gear_lessons"])` und auch `["gear_lessons", student_id]` für den Cache der Detailseite

#### 5. Filter

Ein einfacher Schüler-Filter per Select-Dropdown.

### Geänderte Datei

| Datei | Änderung |
|---|---|
| `src/pages/dashboard/Schaltstunden.tsx` | Vollständige Neuentwicklung: Dialog, Queries, Tabelle, Statistik-Karten, Delete-Funktionalität |

Keine Datenbankänderungen nötig – `gear_lessons` existiert bereits mit allen benötigten Feldern.
