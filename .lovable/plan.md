

## Neue Seite: Monatliche Auswertung

### Uebersicht

Neue Dashboard-Seite "Auswertung" mit monatlicher Uebersicht ueber Umsatz, Fahrstunden und Theoriestunden. Enthält Monats-/Jahresfilter, KPI-Karten und ein Balkendiagramm.

### Aenderungen

**1. Neue Datei: `src/pages/dashboard/Auswertung.tsx`**

- **Filter**: Dropdown fuer Monat (Januar-Dezember) und Jahr (dynamisch aus vorhandenen Daten), vorbelegt mit aktuellem Monat/Jahr
- **Datenquellen**: `payments`, `driving_lessons`, `theory_sessions` -- gefiltert nach gewaehltem Monat/Jahr
- **KPI-Karten** (3 Stueck):
  - Gesamtumsatz (Summe aller Zahlungen im Monat)
  - Anzahl Fahrstunden (absolvierte Fahrstunden im Monat)
  - Anzahl Theoriestunden (absolvierte Theoriestunden im Monat)
- **Diagramm**: Recharts BarChart mit allen 3 Werten pro Monat (letzten 6 oder 12 Monate im Ueberblick), aktueller Monat hervorgehoben
- **Tabelle** (optional): Detailansicht der Monatswerte

**2. Datei: `src/App.tsx`**

- Import und Route hinzufuegen: `/dashboard/auswertung` -> `<Auswertung />`

**3. Datei: `src/components/AppSidebar.tsx`**

- Neuen Menuepunkt "Auswertung" in der Finanzen-Gruppe mit `BarChart3`-Icon hinzufuegen

### Technische Details

- Alle drei Tabellen werden mit `fetchAllRows` geladen (bestehendes Pattern)
- Monatsfilter nutzt `isSameMonth` aus date-fns
- Diagramm zeigt die letzten 12 Monate als Balken (Umsatz als Hauptbalke, Fahrstunden/Theorie als Zahlenwerte)
- Recharts `BarChart` mit `ChartContainer` oder direkt `ResponsiveContainer` (wie in FahrlehrerStatistik)

### Betroffene Dateien

| Datei | Aenderung |
|-------|-----------|
| `src/pages/dashboard/Auswertung.tsx` | Neue Seite (komplett neu) |
| `src/App.tsx` | Route hinzufuegen |
| `src/components/AppSidebar.tsx` | Navigationseintrag hinzufuegen |

