

## Management-Dashboard: Auswertung komplett erweitern

Die bestehende Auswertungsseite wird zu einem vollstaendigen Management-Dashboard umgebaut. Die Datei `src/pages/dashboard/Auswertung.tsx` wird komplett neu geschrieben.

### Keine Datenbank-Aenderungen noetig
Alle benoetigten Daten existieren bereits in den Tabellen: `payments`, `driving_lessons`, `theory_sessions`, `exams`, `students`, `open_items`. Es werden lediglich erweiterte Queries und clientseitige Berechnungen hinzugefuegt.

---

### 1. Erweiterte Daten-Queries

Folgende Daten werden geladen (alle ueber `fetchAllRows`):

| Query | Felder |
|-------|--------|
| `payments` | `datum, betrag` |
| `driving_lessons` | `datum, typ, einheiten, student_id` |
| `theory_sessions` | `datum` |
| `exams` | `datum, typ, status` |
| `students` | `id, vorname, nachname, created_at, status` |
| `open_items` | `student_id, betrag_gesamt, betrag_bezahlt, status` |

### 2. Zeitfilter (oben)

- Monats-Dropdown: "Alle Monate" + Januar bis Dezember
- Jahres-Dropdown: aus vorhandenen Daten abgeleitet
- Bei "Alle Monate" werden alle Daten ungefiltert angezeigt

### 3. KPI-Karten (9 Stueck, 3x3 Grid)

| KPI | Berechnung |
|-----|-----------|
| Gesamtumsatz (alle Zeiten) | Summe aller Zahlungen |
| Umsatz im Monat | Summe Zahlungen im gewaehlten Zeitraum |
| Aktive Schueler gesamt | Schueler mit status != abgeschlossen/abgebrochen |
| Neue Schueler im Monat | Schueler mit `created_at` im Zeitraum |
| Fahrstunden (Einheiten) | Summe `einheiten` (typ != fehlstunde) im Zeitraum |
| Theoriestunden | Anzahl theory_sessions im Zeitraum |
| Pruefungen | Anzahl exams im Zeitraum |
| Bestehensquote | bestanden / (bestanden + nicht_bestanden) in % |
| Offener Gesamt-Saldo | Summe (betrag_gesamt - betrag_bezahlt) aller offenen open_items |

### 4. Vergleich Monat vs. Vormonat

Fuer Umsatz, Fahrstunden und neue Schueler wird die prozentuale Veraenderung zum Vormonat berechnet und als Badge (+12% gruen / -5% rot) in der jeweiligen KPI-Karte angezeigt. Bei "Alle Monate" wird kein Vergleich angezeigt.

### 5. Diagramme (recharts, bereits installiert)

Drei Diagramme untereinander, jeweils in einer Card:

**A) Umsatzentwicklung** - BarChart mit monatlichen Umsaetzen des gewaehlten Jahres (oder aller Jahre bei "Alle Monate")

**B) Schuelerentwicklung** - BarChart mit neuen Schuelern pro Monat

**C) Fahrstunden-Auslastung** - BarChart mit Einheiten pro Monat

Alle Diagramme nutzen die bestehende `ChartContainer`/`ChartTooltip` Komponente aus `src/components/ui/chart.tsx`.

### 6. Betriebsuebersicht (untere Sektion)

Eine Card mit vier Kennzahlen + Top-5-Liste:

- Durchschnittliche Fahrstunden pro Schueler (Einheiten / aktive Schueler)
- Durchschnittlicher Umsatz pro Schueler (Gesamtumsatz / aktive Schueler)
- Monat mit hoechstem Umsatz (automatisch berechnet, Label + Betrag)
- Top 5 Schueler mit hoechstem offenen Saldo (Name + Betrag, verlinkt)

### 7. Datenlogik-Regeln

- `typ === "fehlstunde"` wird bei Fahrstunden-Zaehlung ausgeschlossen
- Nur gespeicherte Zahlungen zaehlen zum Umsatz
- Pruefungen mit `status === "storniert"` werden bei Bestehensquote ignoriert
- Bestehensquote: `status === "bestanden"` vs. `status === "nicht_bestanden"`

---

### Technische Umsetzung

Alles in einer Datei: `src/pages/dashboard/Auswertung.tsx` (komplett neu geschrieben). Keine neuen Abhaengigkeiten noetig -- `recharts` und alle UI-Komponenten sind bereits vorhanden.

### Geschaetzte Groesse
Ca. 350-400 Zeilen Code.

