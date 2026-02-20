

## Schaltstunden-Berechnung im Sonderfahrten-Block korrigieren

### Problem

Im Sonderfahrten-Block wird `gearLessons.length` (Anzahl Eintraege) verwendet, im unteren Block `FLOOR(SUM(dauer_minuten) / 45)`. Bei einer 90-Minuten-Stunde zeigt oben 1/10, unten korrekt 2/10.

### Loesung

Die separaten `gearCount`-Variablen (Zeilen 182-185) werden entfernt und stattdessen die bereits vorhandenen minutenbasierten Variablen (`gearHoursDone`, `gearPct`, `gearComplete`) wiederverwendet.

### Aenderungen in `FahrschuelerDetail.tsx`

1. **Zeilen 181-185 loeschen** -- die COUNT-basierte Berechnung (`gearCount`, `gearCountPct`, `gearCountComplete`) wird komplett entfernt.

2. **Zeile 199**: `gearCountComplete` durch `gearComplete` ersetzen in der `allSonderComplete`-Berechnung.

3. **Sonderfahrten-JSX (Zeilen 430-447)**: Alle Referenzen ersetzen:
   - `gearCount` wird zu `gearHoursDone`
   - `gearCountPct` wird zu `gearPct`
   - `gearCountComplete` wird zu `gearComplete`

Damit gibt es nur noch eine einzige Berechnungslogik: `FLOOR(SUM(dauer_minuten) / 45)`.

### Betroffene Datei

| Datei | Aenderung |
|---|---|
| `src/pages/dashboard/FahrschuelerDetail.tsx` | COUNT-Variablen entfernen, alle Referenzen auf minutenbasierte Variablen umstellen |

