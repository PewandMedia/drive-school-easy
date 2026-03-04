

## PDF-Export fuer Fahrstunden, Leistungen und Zahlungen im Schuelerprofil

### Uebersicht

In den drei Sektionen (Fahrstunden, Leistungen, Zahlungen) im Schuelerprofil wird jeweils ein "Als PDF drucken"-Button hinzugefuegt. Beim Klick wird ein druckoptimiertes Overlay (wie bei Tagesabrechnung) per `window.print()` erzeugt.

### Ansatz

Eine wiederverwendbare Hilfsfunktion/Komponente die:
1. Ein unsichtbares `print:block`-Element rendert mit den Daten
2. Beim Klick auf den Button `window.print()` aufruft
3. Per State steuert welcher Bereich gedruckt wird (fahrstunden/leistungen/zahlungen)

### Aenderungen in `FahrschuelerDetail.tsx`

**1. Print-State hinzufuegen:**
- `const [printSection, setPrintSection] = useState<"fahrstunden" | "leistungen" | "zahlungen" | null>(null)`
- Bei Klick: `setPrintSection("fahrstunden")` → `useEffect` ruft `window.print()` auf → `afterprint` setzt zurueck

**2. Drei PDF-Buttons in den Sektionsheadern (neben "+ hinzufuegen"):**
- Fahrstunden-Header (Zeile ~1703): Printer-Icon-Button
- Leistungen-Header (Zeile ~1772): Printer-Icon-Button
- Zahlungen-Header (Zeile ~1823): Printer-Icon-Button

**3. Print-Area am Ende der Komponente (`hidden print:block`):**

Abhaengig von `printSection` wird gerendert:

- **Fahrstunden-PDF:** Schuelername + Klasse, Tabelle mit Datum/Typ/Dauer/Fahrzeug/Fahrlehrer/Preis, Summenzeile
- **Leistungen-PDF:** Schuelername, Tabelle mit Datum/Bezeichnung/Status/Preis, Summenzeile
- **Zahlungen-PDF:** Schuelername, Tabelle mit Datum/Zahlungsart/Betrag, Summenzeile

**4. Screen-Content ausblenden beim Drucken:**
- Bestehende Inhalte mit `print:hidden` versehen (der aeussere Container)

### Datenstruktur der PDFs

```text
┌──────────────────────────────────────────┐
│ Fahrschulverwaltung – Fahrstunden        │
│ Schueler: Nachname, Vorname (Klasse B)   │
│ Datum: 04.03.2026                        │
├──────────────────────────────────────────┤
│ Datum    │ Typ      │ Dauer │ Preis      │
│ 01.11.25 │ Uebung   │ 45min │ 65,00 €    │
│ ...      │ ...      │ ...   │ ...        │
├──────────────────────────────────────────┤
│                     Gesamt: 1.300,00 €   │
└──────────────────────────────────────────┘
```

### Dateien

| Datei | Aenderung |
|---|---|
| `FahrschuelerDetail.tsx` | Print-State, 3 Drucker-Buttons, Print-Area mit 3 PDF-Layouts |

Keine DB-Aenderungen noetig. Alle Daten sind bereits geladen (lessons, services, payments).

