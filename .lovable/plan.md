

## Fahrlehrer-Statistik Seite visuell und strukturell verbessern

### 1. KPI-Karten oben (4 Karten in einer Reihe)

Vier Karten mit den wichtigsten Kennzahlen, jeweils mit Icon und farblicher Hervorhebung:

| Karte | Inhalt | Icon |
|-------|--------|------|
| Gesamt Fahrpruefungen | Summe aller Praxis-Pruefungen | ClipboardCheck |
| Durchschnittliche Durchfallquote | Durchschnitt ueber alle Fahrlehrer | TrendingDown |
| Bester Fahrlehrer | Name + niedrigste Quote | Trophy |
| Hoechste Durchfallquote | Name + hoechste Quote | AlertTriangle |

### 2. Tabelle verbessern

- Standardsortierung nach Durchfallquote **absteigend** (hoechste Quote oben)
- Farbige Progressbar neben dem Prozentwert:
  - 0-20%: gruen
  - 21-40%: gelb
  - ueber 40%: rot (statt bisherige 50%-Grenze)
- Prozentwert und Progressbar in derselben Zelle nebeneinander

### 3. Balkendiagramm hinzufuegen

- Neuer Bereich unterhalb der KPI-Karten und oberhalb oder neben der Tabelle
- Horizontales Balkendiagramm (recharts `BarChart`) mit Durchfallquote pro Fahrlehrer
- Farben passend zur Farblogik (gruen/gelb/rot)
- Verwendet bestehende `ChartContainer`, `ChartTooltip` Komponenten

### 4. Layout-Optimierung

- Weniger vertikaler Abstand (`space-y-4` statt `space-y-6`)
- KPI-Karten: `grid grid-cols-2 lg:grid-cols-4 gap-4`
- Diagramm und Tabelle nebeneinander auf grossen Bildschirmen: `grid grid-cols-1 xl:grid-cols-2 gap-4`
- Kompakteres Padding in Cards

### Technische Details

**Betroffene Datei:** `src/pages/dashboard/FahrlehrerStatistik.tsx`

**Neue Imports:**
- `ClipboardCheck, TrendingDown, Trophy, AlertTriangle` aus lucide-react
- `BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell, ResponsiveContainer` aus recharts
- `CardHeader, CardTitle` aus card.tsx

**KPI-Berechnung im useMemo:**
```text
gesamtPruefungen = summe aller stats.gesamt
durchschnittQuote = mittelwert aller stats.durchfallquote
besterFahrlehrer = stats mit niedrigster durchfallquote (gesamt > 0)
schlechtesterFahrlehrer = stats mit hoechster durchfallquote
```

**Sortierung:**
```text
.sort((a, b) => b.durchfallquote - a.durchfallquote)
```
(bereits fast so vorhanden, nur Sortierkriterium aendern von `gesamt` auf `durchfallquote`)

**Balkendiagramm:**
- Daten: `stats`-Array mit `name` und `durchfallquote`
- Jeder Balken erhaelt individuelle Fuellfarbe basierend auf Wert
- Tooltip zeigt Fahrlehrer-Name und Quote

