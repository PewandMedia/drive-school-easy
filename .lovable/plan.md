

## Auswertung zum echten Statistik-Dashboard ausbauen

### Ueberblick

Die Platzhalter-Seite wird zu einem vollstaendigen, datengetriebenen Dashboard mit 6 Sektionen, Zeitraum-Filter und Recharts-Diagrammen umgebaut. Alle Daten kommen live aus Supabase.

### Aufbau der neuen Seite

```text
+------------------------------------------------------------------+
| [Zeitraum-Filter: Monat / Quartal / Jahr]   [Jahr-Auswahl]       |
+------------------------------------------------------------------+
| KPI 1              | KPI 2              | KPI 3        | KPI 4   |
| Bestandsquote      | Bestandsquote      | Oe Fahrst.   | Neue    |
| Theorie  82%       | Praxis  71%        | bis Pruef 28 | Schueler|
+------------------------------------------------------------------+
| KPI 5                          | KPI 6                           |
| Gesamtumsatz (Zeitraum)        | Offene vs. Bezahlte Betraege    |
| 12.450 EUR                     | 78% bezahlt / 22% offen         |
+------------------------------------------------------------------+
| Umsatzentwicklung (Balkendiagramm)                                |
| Monatsweise Zahlungseingaenge mit Vormonatsvergleich              |
+------------------------------------------------------------------+
| Schueler pro Monat            | Fahrstunden-Auslastung           |
| (Balkendiagramm)              | (Balkendiagramm)                 |
+------------------------------------------------------------------+
| Pruefungsergebnisse           | Offene vs. Bezahlte Betraege     |
| (Gestapeltes Balkendiagramm)  | (Donut/Pie Chart)                |
+------------------------------------------------------------------+
```

### Datenquellen und Berechnungen

**1. Umsatzentwicklung**
- Quelle: `payments` Tabelle, gruppiert nach Monat des `datum` Feldes
- Balkendiagramm mit monatlichen Summen
- Gesamtumsatz als KPI-Karte oben

**2. Pruefungsstatistik**
- Quelle: `exams` Tabelle
- Bestandsquote Theorie: `COUNT(bestanden=true WHERE typ='theorie') / COUNT(typ='theorie') * 100`
- Bestandsquote Praxis: `COUNT(bestanden=true WHERE typ='praxis') / COUNT(typ='praxis') * 100`
- Gestapeltes Balkendiagramm: Bestanden vs. Nicht bestanden pro Monat

**3. Durchschnittliche Fahrstunden bis Pruefung**
- Quelle: `driving_lessons` + `exams` (typ='praxis', bestanden=true)
- Fuer jeden Schueler mit bestandener Praxis: Anzahl Fahrstunden zaehlen
- Durchschnitt bilden

**4. Neue Schueler pro Monat**
- Quelle: `students.created_at`, gruppiert nach Monat
- Balkendiagramm

**5. Fahrstunden-Auslastung**
- Quelle: `driving_lessons.datum`, gruppiert nach Monat
- Anzahl Fahrstunden pro Monat als Balkendiagramm

**6. Offene vs. Bezahlte Betraege**
- Quelle: `open_items`
- Gesamtsumme `betrag_gesamt` vs. Gesamtsumme `betrag_bezahlt`
- Prozentuale Quote und Donut-Diagramm

### Zeitraum-Filter

- Oben auf der Seite: Select mit Optionen "Diesen Monat", "Dieses Quartal", "Dieses Jahr", "Letztes Jahr", "Gesamt"
- Alle Queries filtern nach dem gewaehlten Zeitraum
- Diagramme und KPIs aktualisieren sich live

### Technische Umsetzung

| Bereich | Details |
|---------|---------|
| Datei | `src/pages/dashboard/Auswertung.tsx` (kompletter Neubau) |
| Queries | 5 separate `useQuery` Hooks fuer payments, exams, driving_lessons, students, open_items |
| Diagramme | Recharts (bereits installiert): BarChart, PieChart, ResponsiveContainer, Tooltip |
| Filter | `useState` fuer Zeitraum, `useMemo` fuer gefilterte Daten |
| UI-Komponenten | Card, Select aus bestehenden shadcn-Komponenten |
| Stil | Dunkles Design beibehalten, gleicher Stil wie FahrlehrerStatistik |

### KPI-Karten (oberer Bereich)

6 Karten in 2 Reihen:
1. **Bestandsquote Theorie** - Prozent mit Trend-Icon
2. **Bestandsquote Praxis** - Prozent mit Trend-Icon
3. **Oe Fahrstunden bis Pruefung** - Durchschnittswert
4. **Neue Schueler** - Anzahl im Zeitraum
5. **Gesamtumsatz** - Summe Zahlungseingaenge im Zeitraum
6. **Bezahlquote** - Prozent bezahlt von Forderungen

### Diagramme (unterer Bereich)

4 Diagramme in 2x2 Grid:
1. **Umsatzentwicklung** - Vertikales Balkendiagramm, monatlich, Euros auf Y-Achse
2. **Schueler pro Monat** - Vertikales Balkendiagramm
3. **Pruefungsergebnisse** - Gestapeltes Balkendiagramm (bestanden gruen / nicht bestanden rot)
4. **Offene vs. Bezahlte Betraege** - Donut-Chart mit Legende

### Zusammenfassung

| Datei | Aenderung |
|-------|-----------|
| `src/pages/dashboard/Auswertung.tsx` | Kompletter Neubau mit 5 Supabase-Queries, 6 KPI-Karten, 4 Recharts-Diagrammen und Zeitraum-Filter |

