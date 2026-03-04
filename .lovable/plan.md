

## Druck-Button bei Prüfungen hinzufuegen

### Aenderungen in `FahrschuelerDetail.tsx`

**1. `printSection` Type erweitern (Zeile 127):**
- `"pruefungen"` zum Union-Typ hinzufuegen: `"fahrstunden" | "leistungen" | "zahlungen" | "pruefungen" | null`

**2. Drucker-Button im Prüfungen-Header (Zeile 1619-1620):**
- Zwischen Header und Add-Button einen Printer-Icon-Button einfuegen (gleicher Stil wie bei den anderen Sektionen)
- `onClick={() => setPrintSection("pruefungen")}`

**3. Print-Area Title erweitern (Zeile 2595):**
- `printSection === "pruefungen" ? "Prüfungen"` zum Titel-Mapping hinzufuegen

**4. Prüfungen-Druckbereich hinzufuegen (nach Zeile 2692, vor `</div>`):**
- Tabelle mit Spalten: Datum, Typ (Theorie/Praxis), Ergebnis (Bestanden/Nicht bestanden), ggf. Preis
- Summenzeile mit Gesamtkosten der Prüfungen

| Datei | Aenderung |
|---|---|
| `FahrschuelerDetail.tsx` | printSection-Typ erweitern, Drucker-Button bei Prüfungen, Print-Layout fuer Prüfungen |

