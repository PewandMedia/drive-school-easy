

## Pruefungs-System erweitern: Status-Logik

### Uebersicht

Das bisherige `bestanden` (boolean) wird durch eine neue `status`-Spalte ersetzt, die vier Zustaende unterstuetzt: **angemeldet**, **bestanden**, **nicht_bestanden**, **krank**. Neue Pruefungen starten immer mit "angemeldet". Die Statistik zaehlt nur "bestanden" und "nicht_bestanden".

### Schritt 1: Datenbank-Migration

Neue Spalte `status` als Text mit Standardwert `'angemeldet'` in der `exams`-Tabelle. Bestehende Daten werden migriert (`bestanden=true` wird `'bestanden'`, `bestanden=false` wird `'nicht_bestanden'`). Danach wird die `bestanden`-Spalte entfernt.

```text
ALTER TABLE exams ADD COLUMN status text NOT NULL DEFAULT 'angemeldet';

UPDATE exams SET status = CASE
  WHEN bestanden = true THEN 'bestanden'
  ELSE 'nicht_bestanden'
END;

ALTER TABLE exams DROP COLUMN bestanden;
```

Ausserdem muss der Trigger `create_open_item_for_exam` angepasst werden, da er bisher `bestanden` nicht verwendet -- er bleibt unveraendert.

### Schritt 2: Frontend anpassen (`src/pages/dashboard/Pruefungen.tsx`)

**2a. ExamForm-Typ aendern**

- `bestanden: boolean` wird ersetzt durch `status: "angemeldet" | "bestanden" | "nicht_bestanden" | "krank"`
- Default-Status bei Erstellung: `"angemeldet"`

**2b. Ergebnis-Dropdown im Erstellungsdialog**

- Beim Eintragen einer neuen Pruefung wird das "Ergebnis"-Feld entfernt oder durch ein Status-Feld ersetzt
- Standardmaessig "Angemeldet" -- der Nutzer kann aber auch direkt einen anderen Status waehlen

**2c. Status in der Tabelle anzeigen**

Vier verschiedene Badge-Styles:
- Angemeldet: blau/neutral
- Bestanden: gruen
- Nicht bestanden: rot
- Krank: gelb/orange

**2d. Status-Aenderung in der Tabelle**

Jede Zeile bekommt ein klickbares Status-Badge oder einen kleinen Edit-Button, der ein Dropdown oeffnet zum Aendern des Status. Dafuer wird eine `updateStatusMutation` ergaenzt, die per `supabase.from("exams").update({ status }).eq("id", examId)` den Status aktualisiert.

**2e. Statistik anpassen**

- "Bestanden" zaehlt nur `status === 'bestanden'`
- "Nicht bestanden" zaehlt nur `status === 'nicht_bestanden'`
- "Gesamt" zeigt alle Pruefungen
- Optional: "Angemeldet" und "Krank" als zusaetzliche Statistik-Karten

### Schritt 3: Weitere Stellen pruefen

Andere Seiten (z.B. FahrschuelerDetail) die `exam.bestanden` referenzieren, muessen auf `exam.status` umgestellt werden.

### Betroffene Dateien

| Datei | Aenderung |
|-------|-----------|
| DB-Migration | `status`-Spalte hinzufuegen, Daten migrieren, `bestanden` entfernen |
| `src/pages/dashboard/Pruefungen.tsx` | Form-Typ, Badge-Logik, Status-Dropdown in Tabelle, Statistik-Berechnung, Update-Mutation |
| `src/pages/dashboard/FahrschuelerDetail.tsx` | `bestanden` durch `status` ersetzen (falls referenziert) |

