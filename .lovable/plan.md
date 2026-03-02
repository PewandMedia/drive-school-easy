
## Pruefungstabelle: Alle Spalten nach gewaehltem Zeitraum filtern

### Problem
Wenn man z.B. "Maerz" auswaehlt, zeigen die Spalten "Gesamt", "Bestanden" und "Nicht bestanden" trotzdem die Zahlen seit Beginn -- nicht die Werte fuer Maerz. Nur die Spalte mit dem Monatsnamen wird gefiltert. Das ist verwirrend und macht keinen Sinn.

### Loesung
Alle Pruefungs-Spalten (Gesamt, Bestanden, Nicht bestanden, Bestehensquote) sollen sich auf den gewaehlten Zeitraum beziehen. Die separate "Monat"-Spalte wird entfernt, da sie dann redundant waere.

### Aenderung

| Datei | Was |
|-------|-----|
| `src/pages/dashboard/FahrlehrerStatistik.tsx` | Pruefungs-Berechnung und Tabellen-Spalten anpassen |

### Details

**1. Berechnung anpassen (Zeilen ~160-165)**

Statt `bestanden`/`nichtBestanden` ueber alle Exams zu berechnen, werden sie auf `inPeriod` gefiltert:

```
const myPeriodExams = myExams.filter(e => inPeriod(e.datum));
const bestanden = myPeriodExams.filter(e => e.status === "bestanden").length;
const nichtBestanden = myPeriodExams.filter(e => e.status === "nicht_bestanden").length;
const pruefungen = bestanden + nichtBestanden;
const bestehensquote = pruefungen > 0 ? Math.round((bestanden / pruefungen) * 100) : -1;
```

**2. Redundante Spalte entfernen**

Die Spalte `pruefungenPeriod` (die den Monatsnamen als Header hat) wird entfernt, da "Gesamt" jetzt bereits den gewaehlten Zeitraum zeigt.

**3. Tabellen-Header anpassen**

Die Spalten werden: Fahrlehrer | Gesamt | Bestanden | Nicht best. | Bestehensquote (5 Spalten statt 6).

**4. examStats-Filter anpassen**

`examStats` filtert aktuell auf `s.pruefungen > 0`. Da `pruefungen` jetzt periodenbasiert ist, werden nur Fahrlehrer mit Pruefungen im gewaehlten Zeitraum angezeigt.

**5. KPI-Karten Bestanden/Nicht bestanden**

Die KPI-Karte "Pruefungen" zeigt aktuell `totalBestanden`/`totalNichtBestanden` ueber alle Zeiten. Diese werden ebenfalls auf den Zeitraum beschraenkt.
