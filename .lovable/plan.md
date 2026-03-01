

## Fahrlehrer-Statistik zum Leistungs-Dashboard erweitern

### Uebersicht

Die bestehende Fahrlehrer-Statistik-Seite wird von einer reinen Pruefungs-Durchfallquoten-Ansicht zu einem vollstaendigen Leistungs-Dashboard umgebaut. Pro Fahrlehrer werden Fahrstunden, Theoriestunden, Pruefungen, Bestehensquote und Umsatz angezeigt -- filterbar nach Monat/Jahr.

### Aenderungen

**Datei: `src/pages/dashboard/FahrlehrerStatistik.tsx`** (komplett ueberarbeiten)

**A) Neue Datenquellen laden**

Zusaetzlich zu `instructors` und `exams` werden geladen:
- `driving_lessons` (mit `fetchAllRows`): Felder `instructor_id`, `datum`, `einheiten`, `preis`, `typ`
- `theory_sessions` (mit `fetchAllRows`): Felder `instructor_id`, `datum`

Fehlstunden (`typ === "fehlstunde"`) werden bei Fahrstunden ausgeschlossen.

**B) Monats-/Jahresfilter**

- Zwei Select-Dropdowns oben: Monat (Januar-Dezember) und Jahr (dynamisch aus Daten)
- Vorbelegung: aktueller Monat/Jahr
- Alle Berechnungen werden sowohl fuer "Gesamt" als auch fuer den gewaehlten Monat durchgefuehrt

**C) Globale KPI-Karten (4-6 Karten)**

Oberste Zeile mit aggregierten Werten ueber alle Fahrlehrer:
- Gesamt Fahrstunden (Einheiten) im gewaehlten Monat
- Gesamt Theoriestunden im gewaehlten Monat
- Gesamt Pruefungen im gewaehlten Monat
- Durchschnittliche Bestehensquote
- Gesamt Umsatz (Summe `preis` der Fahrstunden im Monat)

**D) Detailtabelle pro Fahrlehrer**

Eine Tabelle mit folgenden Spalten:
| Fahrlehrer | Fahrstunden (E) Monat | Fahrstunden (E) Gesamt | Theorie Monat | Theorie Gesamt | Pruefungen | Bestehensquote | Umsatz Monat |

- Sortierbar ueber Spaltenheader-Klick (Ranking-System)
- Standard-Sortierung: meiste Fahrstunden im Monat
- Bestehensquote mit Farbindikator (Gruen/Gelb/Rot wie bisher)

**E) Bisheriges Balkendiagramm entfernen**

Das alte Durchfallquoten-Balkendiagramm wird durch die erweiterte Tabelle ersetzt. Die Pruefungsdaten (bestanden/nicht bestanden) fliessen in die Bestehensquote-Spalte ein.

### Technische Details

- `driving_lessons` werden mit `fetchAllRows` geladen und nach `instructor_id IS NOT NULL` und `typ !== "fehlstunde"` gefiltert
- `theory_sessions` werden mit `fetchAllRows` geladen und nach `instructor_id IS NOT NULL` gefiltert
- Monatsfilter nutzt `isWithinInterval`, `startOfMonth`, `endOfMonth` aus `date-fns`
- Sortierung ueber einen `sortKey`/`sortDir` State, der beim Klick auf Spaltenheader wechselt
- Bestehensquote = `bestanden / (bestanden + nicht_bestanden) * 100` (invertiert gegenueber der bisherigen Durchfallquote)
- Umsatz = `SUM(preis)` der Fahrstunden des Fahrlehrers (ohne Fehlstunden)

### Betroffene Dateien

| Datei | Aenderung |
|-------|-----------|
| `src/pages/dashboard/FahrlehrerStatistik.tsx` | Komplett ueberarbeiten: neue Queries, Filter, KPIs, erweiterte Tabelle mit Sortierung |

Keine Datenbank-Aenderungen noetig -- alle Daten sind bereits vorhanden.

