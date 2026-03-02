

## Fahrlehrer-Statistik: Pruefungen und Stunden in zwei getrennte Tabellen aufteilen

### Uebersicht

Die aktuelle Seite zeigt alles in einer einzigen Tabelle. Der Nutzer moechte zwei separate Bereiche:
1. **Pruefungen** -- wie vorher: Fahrlehrer, Anzahl Pruefungen, Bestehensquote mit Farbbalken
2. **Stunden-Tracking** -- darunter: Fahrstunden (Einheiten Monat/Gesamt), Theoriestunden (Monat/Gesamt), Umsatz

### Aenderungen

**Datei: `src/pages/dashboard/FahrlehrerStatistik.tsx`**

**A) Erste Tabelle: Pruefungen (oben)**

Spalten:
| Fahrlehrer | Pruefungen Gesamt | Pruefungen Monat | Bestehensquote (mit Farbbalken) |

Eigene Sortierung (separater State oder gleicher mit angepassten Keys).

**B) Zweite Tabelle: Stunden-Tracking (darunter)**

Spalten:
| Fahrlehrer | Fahrst. (E) Monat | Fahrst. (E) Gesamt | Theorie Monat | Theorie Gesamt | Umsatz Monat |

Eigene Sortierung.

**C) KPI-Karten bleiben oben**

Die 5 KPI-Karten (Fahrstunden, Theorie, Pruefungen, Bestehensquote, Umsatz) bleiben unveraendert.

**D) Ueberschriften fuer jeden Bereich**

Jede Tabelle erhaelt eine eigene Card mit Titel:
- "Pruefungen" mit ClipboardCheck-Icon
- "Stunden & Umsatz" mit Car-Icon

### Technische Details

- Zwei separate Sort-States: `sortKeyExams`/`sortDirExams` und `sortKeyHours`/`sortDirHours`
- Zwei separate SortKey-Types fuer die jeweiligen Spalten
- Bestehende Daten-Berechnung (`stats`) bleibt gleich, nur die Darstellung wird in zwei Tabellen aufgeteilt
- Pruefungen-Tabelle zeigt nur Fahrlehrer mit mindestens einer Pruefung
- Stunden-Tabelle zeigt nur Fahrlehrer mit mindestens einer Fahrstunde oder Theoriestunde

### Betroffene Dateien

| Datei | Aenderung |
|-------|-----------|
| `src/pages/dashboard/FahrlehrerStatistik.tsx` | Eine Tabelle in zwei getrennte Tabellen aufteilen (Pruefungen oben, Stunden unten) |

