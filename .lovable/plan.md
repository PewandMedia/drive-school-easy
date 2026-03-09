

## Kombi-Druck-Button unter Kontaktdaten

### Uebersicht

Ein neuer "Drucken"-Button unter den Kontaktdaten oeffnet einen Dialog mit Checkboxen fuer Fahrstunden, Leistungen, Pruefungen und Zahlungen. Der Nutzer waehlt die gewuenschten Bereiche aus und klickt "Drucken" – alle ausgewaehlten Sektionen erscheinen in einem einzigen PDF-Dokument.

### Aenderungen in `FahrschuelerDetail.tsx`

**1. Neuer State (neben `printSection`):**
- `printSections` als `Set<string>` oder Array: `useState<string[]>([])` fuer Multi-Auswahl
- `dlgPrint` als `boolean` fuer den Auswahl-Dialog

**2. Druck-Button unter Kontaktdaten (nach Zeile 1073):**
- Button mit Printer-Icon und Text "Übersicht drucken"
- `onClick={() => setDlgPrint(true)}`

**3. Auswahl-Dialog:**
- 4 Checkboxen: Fahrstunden, Pruefungen, Leistungen, Zahlungen
- "Alle auswaehlen" Toggle
- "Drucken"-Button setzt `printSections` und schliesst Dialog, loest `window.print()` aus

**4. Print-Area erweitern:**
- Bestehenden `printSection`-Block beibehalten (fuer Einzel-Druck-Buttons)
- Neuen Block fuer `printSections.length > 0`: rendert alle ausgewaehlten Sektionen hintereinander mit Seitenumbruch-Hints (`page-break-before`) zwischen Sektionen
- Jede Sektion: eigene Ueberschrift, Tabelle, Summenzeile
- Gemeinsamer Header mit Schuelername, Klasse, Datum

**5. Print-Trigger:**
- Bestehenden `useEffect` erweitern: auch bei `printSections.length > 0` drucken
- `afterprint` setzt `printSections` zurueck auf `[]`

### Dateien

| Datei | Aenderung |
|---|---|
| `FahrschuelerDetail.tsx` | Neuer State, Druck-Button, Auswahl-Dialog, erweiterter Print-Bereich |

