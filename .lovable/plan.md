## Neue Seite „Kontrolle"

Fügt einen neuen Menüpunkt **Kontrolle** unterhalb von **Schnellerfassung** in der Sidebar hinzu.

### Funktionsumfang
- Zwei Datumsfelder: **Von** und **Bis** (Default: erster Tag des laufenden Monats bis heute).
- Optionaler Filiale-Filter (Alle / Riemke Markt / Rathaus) analog zu Tagesabrechnung.
- Zwei Tabellen untereinander:
  1. **Fahrstunden** im Zeitraum – Datum, Schüler (Nachname, Vorname), Fahrlehrer, Einheiten/Dauer, Preis.
  2. **Zahlungen** im Zeitraum – Einnahmedatum, Einreichungsdatum, Schüler, Fahrlehrer, Zahlungsart, Filiale, Betrag.
- Zusammenfassungs-Karten oben: Anzahl Fahrstunden, Summe Einheiten, Summe Fahrstunden-Umsatz, Anzahl Zahlungen, Summe Zahlungen.
- Suche über Schülernamen zusätzlich zum Zeitraum.

### Technische Umsetzung
- Neue Datei `src/pages/dashboard/Kontrolle.tsx`.
- Queries mit `fetchAllRows` auf `driving_lessons` und `payments`, gefiltert per `.gte('datum', von).lte('datum', bis)` (Zahlungen filtern nach `datum` = Einnahmedatum).
- Route `/dashboard/kontrolle` in `src/App.tsx` (lazy geladen wie die anderen Dashboard-Routen).
- Eintrag in `src/components/AppSidebar.tsx` direkt unter Schnellerfassung mit passendem Lucide-Icon (`ClipboardCheck`).
- Reine Leseansicht – keine DB-Migrationen, keine Mutationen.
