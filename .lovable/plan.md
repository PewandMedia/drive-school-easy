
## Theorie-Seite vollständig implementieren

### Analyse

Die Seite `Theorie.tsx` ist ein reiner Platzhalter – der Button „+ Kurs erstellen" öffnet keinen Dialog und es gibt keine Supabase-Anbindung.

Die Datenbanktabelle `theory_sessions` hat folgende Struktur:
- `id` (uuid)
- `student_id` (uuid)
- `typ` (enum: `grundstoff` | `klassenspezifisch`)
- `datum` (timestamptz)
- `created_at` (timestamptz)

Kein Dauer-Feld – eine Theoriestunde entspricht immer einer Einheit (90 Minuten Standard in deutschen Fahrschulen). Der „Typ" bestimmt, ob es Grundstoff oder klassenspezifischer Stoff ist.

---

### Geplante Implementierung

Analog zu `Schaltstunden.tsx` wird die Seite vollständig neu gebaut.

#### 1. Dialog „Theoriestunde eintragen"

Felder:
- **Schüler** – Select aus `students`
- **Datum & Uhrzeit** – `datetime-local` Input
- **Typ** – Select: `Grundstoff` / `Klassenspezifisch`

#### 2. Statistik-Karten (oben)

3 Karten (ersetzen die statischen Platzhalter):
- **Theoriestunden gesamt** – `COUNT(*)` aus `theory_sessions`
- **Schüler mit Grundstoff** – Anzahl eindeutiger Schüler mit mind. 1 Grundstoff-Einheit
- **Klassenspezifisch** – Anzahl klassenspezifischer Einträge gesamt

#### 3. Tabelle

Spalten:
- Schüler
- Datum
- Typ (Badge: „Grundstoff" / „Klassenspezifisch")
- Einheit (laufende Nummer pro Schüler, z. B. „3. Stunde")
- Löschen-Button

Tabelle nach Datum absteigend sortiert.

#### 4. Filter

Schüler-Filter per Select-Dropdown (identisch zu Schaltstunden-Seite).

#### 5. Mutations

- **Insert**: `supabase.from("theory_sessions").insert({ student_id, datum, typ })`
- **Delete**: `supabase.from("theory_sessions").delete().eq("id", id)`
- Nach jeder Mutation: `queryClient.invalidateQueries({ queryKey: ["theory_sessions"] })`

---

### Geänderte Datei

| Datei | Änderung |
|---|---|
| `src/pages/dashboard/Theorie.tsx` | Vollständige Neuentwicklung: Dialog, Queries, Tabelle, Statistik-Karten, Delete-Funktionalität |

Keine Datenbankänderungen nötig – `theory_sessions` existiert bereits mit allen benötigten Feldern.
