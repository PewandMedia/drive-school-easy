

## Fahrlehrer-Statistik optimieren: Bessere Darstellung und Jahresansicht

### Uebersicht

Die Fahrlehrer-Statistik wird visuell verbessert und um eine Jahresansicht erweitert. Der Zeitfilter bekommt eine "Ganzes Jahr"-Option, damit man sowohl einzelne Monate als auch das komplette Jahr auf einen Blick sehen kann. Die Tabellen werden optisch aufgewertet mit besserer Lesbarkeit.

### Aenderungen

**Datei: `src/pages/dashboard/FahrlehrerStatistik.tsx`**

**A) Zeitfilter erweitern: Jahresansicht**

- Neuer Filter-Modus: "Monat" oder "Ganzes Jahr"
- Wenn "Ganzes Jahr" gewaehlt: Alle Monatswerte zeigen die Summen fuer das gesamte Jahr
- KPI-Karten passen sich entsprechend an (Label aendert sich zu "Jahr" statt "Monat")
- Umsetzung: Ein Toggle oder eine zusaetzliche Select-Option "Ganzes Jahr" im Monatsfilter

**B) Visuelle Verbesserungen Stunden-Tabelle**

- Farbige Hervorhebung der Monatswerte (leichter Hintergrund bei aktiven Werten)
- Null-Werte in Grau/gedaempft darstellen statt schwarze "0"
- Umsatz-Spalte mit Euro-Formatierung und dezenter Farbe
- Zeilen-Hover-Effekt fuer bessere Lesbarkeit
- Summenzeile am Ende der Tabelle (Totals ueber alle Fahrlehrer)

**C) Stunden-Tabelle: Durchschnitt pro Monat hinzufuegen**

- Neue Spalte oder Zeile: "Durchschnitt Einheiten pro Monat" pro Fahrlehrer
- Berechnung: Fahrstunden Gesamt / Anzahl aktive Monate

**D) KPI-Karten: Label dynamisch**

- Wenn Jahresansicht aktiv: "Fahrstunden (Jahr)" statt "Fahrstunden (E)"
- Wenn Monatsansicht: aktueller Monatsname im Label anzeigen (z.B. "Fahrstunden Maerz")

**E) Alle Fahrlehrer immer anzeigen**

- Auch Fahrlehrer ohne Stunden in der Stunden-Tabelle anzeigen (mit 0-Werten)
- So hat man eine vollstaendige Uebersicht ueber alle registrierten Fahrlehrer

### Technische Details

- Neuer State `viewMode: "month" | "year"` oder alternativ einen speziellen Monatswert (z.B. -1) fuer "Ganzes Jahr"
- `inMonth`-Funktion wird erweitert: Bei Jahresansicht prueft sie nur das Jahr, nicht den Monat
- `monthInterval` wird bei Jahresansicht auf 1. Januar bis 31. Dezember gesetzt
- Summenzeile: Zusaetzliche `useMemo`-Berechnung fuer Totals
- Null-Werte: `cn("text-center", val === 0 && "text-muted-foreground")` fuer gedaempfte Darstellung
- Queries und Datenberechnung bleiben unberuehrt -- nur Filterung und Darstellung aendert sich

### Betroffene Dateien

| Datei | Aenderung |
|-------|-----------|
| `src/pages/dashboard/FahrlehrerStatistik.tsx` | Jahresansicht, visuelle Optimierung, Summenzeile, dynamische Labels |

