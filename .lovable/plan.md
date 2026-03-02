

## Fahrlehrer-Statistik optimieren: Premium-Darstellung mit detaillierten Pruefungsdaten

### Uebersicht

Die Fahrlehrer-Statistik wird visuell auf Premium-Niveau gehoben. Die Pruefungstabelle zeigt kuenftig pro Fahrlehrer die Aufschluesselung Bestanden/Nicht bestanden neben der Quote. Der Monatsfilter wird prominenter als Button-Leiste gestaltet fuer schnellen Zugriff.

### Aenderungen

**Datei: `src/pages/dashboard/FahrlehrerStatistik.tsx`**

**A) Monatsfilter als prominente Button-Leiste**

- Ersetze die drei separaten Select-Dropdowns durch eine uebersichtliche Filter-Leiste:
  - Segmented-Button-Gruppe fuer "Monat" vs "Ganzes Jahr"
  - Monatsauswahl als kompakte Button-Reihe (Jan, Feb, Marz, ...) mit aktivem Monat hervorgehoben
  - Jahresauswahl daneben
- Visuell klar, sofort erkennbar welcher Zeitraum gewaehlt ist

**B) Pruefungstabelle: Bestanden/Nicht bestanden Spalten hinzufuegen**

Aktuelle Spalten: Fahrlehrer | Gesamt | Monat | Bestehensquote

Neue Spalten: Fahrlehrer | Gesamt | Bestanden | Nicht bestanden | Monat | Bestehensquote

- Neue Spalte "Bestanden" mit gruener Zahl
- Neue Spalte "Nicht best." mit roter Zahl
- Berechnung bereits vorhanden in `stats` (bestanden/nichtBestanden), muss nur in die Rueckgabe und Tabelle aufgenommen werden

**C) Stats-Objekt erweitern**

Im `stats`-useMemo die Werte `bestanden` und `nichtBestanden` zum Rueckgabeobjekt hinzufuegen (werden aktuell berechnet aber nicht zurueckgegeben).

**D) Visuelle Aufwertung der KPI-Karten**

- Groessere Karten mit mehr Abstand
- Dezente Trennlinien und Schatten
- Werte-Formatierung verbessern (Tausendertrennzeichen bei Umsatz)

**E) Gesamtlayout aufgeraeumt**

- Mehr vertikaler Abstand zwischen den Sektionen
- Tabellen-Header mit dezenter Hintergrundfarbe
- Aktiver Zeitraum wird als Badge/Pill prominent ueber den Tabellen angezeigt

### Technische Details

- `stats` Return-Objekt erhaelt zwei neue Felder: `bestanden: number` und `nichtBestanden: number`
- `ExamSortKey` Type erhaelt zwei neue Werte: `"bestanden"` und `"nichtBestanden"`
- Pruefungstabelle bekommt zwei neue `SortableHead` und `TableCell` Spalten
- Monatsfilter: Die 12 Monate als kleine Buttons (`variant="ghost"` oder `variant="outline"`, aktiver Monat mit `variant="default"`)
- `colSpan` in leeren Zustaenden anpassen (4 auf 6)

### Betroffene Dateien

| Datei | Aenderung |
|-------|-----------|
| `src/pages/dashboard/FahrlehrerStatistik.tsx` | Filter-Leiste, erweiterte Pruefungstabelle (Bestanden/Nicht bestanden), visuelle Verbesserungen |

