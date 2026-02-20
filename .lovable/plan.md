

## Schaltstunden: Einheiten-Berechnung korrigieren (wie Fahrstunden)

### Problem
Die Spalte "Einheit" zeigt aktuell eine laufende Nummer pro Schueler ("1. Stunde", "2. Stunde") statt der korrekten Einheitenberechnung. 90 Minuten werden als "1. Stunde" angezeigt, sollen aber "2E" sein.

### Aenderungen in `src/pages/dashboard/Schaltstunden.tsx`

**1. Einheiten-Berechnung in der Tabelle**
- Spalte "Dauer" und "Einheit" zusammenfuehren bzw. Einheit korrekt berechnen
- Formel: `Einheiten = Math.floor(dauer_minuten / 45)`
- Anzeige im Format: `"90 min (2E)"`, `"45 min (1E)"`, `"135 min (3E)"`
- Die bisherige laufende Nummerierung (lessonNumberMap/counterPerStudent) wird entfernt

**2. Statistik-Karte "Schaltstunden gesamt" in Einheiten**
- Statt `lessons.length` (Anzahl Eintraege) wird die Summe der Einheiten angezeigt
- Berechnung: `lessons.reduce((sum, l) => sum + Math.floor(l.dauer_minuten / 45), 0)`
- Label aendern zu "Einheiten gesamt"

**3. Tabellenspalten anpassen**
- Spalte "Dauer" zeigt weiterhin die Minuten
- Spalte "Einheit" zeigt das neue Format: `"{dauer} min ({einheiten}E)"`
- Alternativ: Beide Infos in einer Spalte kombinieren wie bei Fahrstunden

### Technische Details

- Entfernung des `lessonNumberMap` und `counterPerStudent` Codes (ca. 10 Zeilen)
- Inline-Berechnung `Math.floor(lesson.dauer_minuten / 45)` in der Tabellenzeile
- Statistik-Karte: `lessons.reduce(...)` statt `lessons.length`
- Konstante `SCHALTSTUNDEN_PFLICHT` bleibt bestehen (bezieht sich auf Pflicht-Einheiten)
- Konsistent mit der Fahrstunden-Logik (`FLOOR(dauer_minuten / 45)`)

