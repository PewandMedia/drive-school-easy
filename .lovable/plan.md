

## Auswertung: Diagramm entfernen, nur Daten anzeigen

### Aenderung

**Datei: `src/pages/dashboard/Auswertung.tsx`**

- Das komplette Balkendiagramm (BarChart mit ResponsiveContainer) und die zugehoerige Card entfernen
- Die `chartData`-Berechnung (`useMemo`) entfernen, da sie nicht mehr benoetigt wird
- Imports bereinigen: `BarChart`, `Bar`, `XAxis`, `YAxis`, `CartesianGrid`, `ResponsiveContainer`, `Tooltip`, `Legend`, `subMonths` entfernen
- Die KPI-Karten (Gesamtumsatz, Fahrstunden, Theoriestunden) und die Filter (Monat/Jahr) bleiben bestehen

### Ergebnis

Die Seite zeigt nur noch die Monats-/Jahresfilter und die drei Kennzahl-Karten -- ohne Diagramm.

