

## Stunden & Umsatz: "Gesamt"-Spalten entfernen

### Problem
Die Tabelle "Stunden & Umsatz" zeigt aktuell sowohl die Werte fuer den gewaehlten Zeitraum als auch "Gesamt"-Spalten (Fahrst. Ges., Theorie Ges.). Das ist ueberfluessig -- wenn man Gesamt sehen will, waehlt man einfach "Ganzes Jahr".

### Loesung
Die Spalten "Fahrst. Ges." und "Theorie Ges." werden entfernt. Die Tabelle zeigt dann nur noch:

**Fahrlehrer | Fahrstunden | Oe/Monat | Theorie | Umsatz** (5 Spalten statt 7)

Die Spaltenheader "Fahrstunden" und "Theorie" zeigen weiterhin den Periodenamen (z.B. "Fahrstunden Februar").

### Aenderung

| Datei | Was |
|-------|-----|
| `src/pages/dashboard/FahrlehrerStatistik.tsx` | 2 Spalten aus Tabelle und Totals entfernen |

### Details

1. **HoursSortKey-Type**: `fahrstundenGesamt` und `theorieGesamt` entfernen
2. **Tabellen-Header** (Zeilen 448-454): Die zwei `SortableHead` fuer `fahrstundenGesamt` und `theorieGesamt` entfernen
3. **Tabellen-Body** (Zeilen 477-481): Die zwei `TableCell` fuer `fahrstundenGesamt` und `theorieGesamt` entfernen
4. **Skeleton-Loader** (Zeile 461): Von 7 auf 5 Spalten reduzieren
5. **Leere-Zeile colSpan** (Zeile 468): Von 7 auf 5 aendern
6. **Totals-Zeile** (Zeilen 489-497): Die zwei Zellen fuer `fahrstundenGesamt` und `theorieGesamt` entfernen
7. **Totals-useMemo** (Zeilen 204-211): `fahrstundenGesamt` und `theorieGesamt` aus der Berechnung entfernen

