

## Tagesabrechnung (druckbare Kassenuebersicht pro Tag)

### Uebersicht
Neue Seite `Tagesabrechnung` im Finanzbereich, die fuer ein gewaehltes Datum alle Zahlungen auflistet, nach Zahlungsart summiert und eine druckoptimierte PDF-Ausgabe (via Browser-Druckfunktion) ermoeglicht.

### Aenderung 1: Neue Datei `src/pages/dashboard/Tagesabrechnung.tsx`

**Aufbau der Seite:**

- PageHeader mit Icon `FileText` und Titel "Tagesabrechnung"
- Datumsauswahl (Input type="date", Standard = heute) + Button "Tagesabrechnung erstellen"
- Nach Klick: Supabase-Query auf `payments` gefiltert nach dem gewaehlten Datum (Tagesbereich via `gte` / `lt`), mit Join auf `students(vorname, nachname, geburtsdatum)`
- Sortierung nach `datum` aufsteigend (chronologisch nach Uhrzeit)

**Tabelle:**

| Uhrzeit | Schueler | Geburtsdatum | Zahlungsart | Betrag |
|---------|----------|--------------|-------------|--------|

- Uhrzeit: `format(datum, "HH:mm")`
- Schueler: Vorname Nachname
- Geburtsdatum: dd.MM.yyyy oder "–"
- Zahlungsart: Bar / EC-Karte / Ueberweisung mit Icon
- Betrag: formatiert in EUR

**Summen-Bereich unter der Tabelle:**
- Bar gesamt, EC gesamt, Ueberweisung gesamt, Gesamtbetrag
- Anzahl Zahlungen

**Notizfeld:**
- Textarea "Tagesnotizen / Kassenvermerk" (lokaler State, nicht in DB gespeichert)
- Wird beim Drucken mit ausgegeben

**Leere Anzeige:**
- "Fuer dieses Datum wurden keine Zahlungen erfasst."

**Zahlungsart-Filter (optional):**
- Select-Dropdown zum Filtern nach Zahlungsart (Alle / Bar / EC / Ueberweisung)
- Filtert nur die Tabellenanzeige, Summen bleiben auf alle Zahlungen des Tages bezogen

**Druckfunktion:**
- Button "Als PDF exportieren" loest `window.print()` aus
- Ein versteckter Druckbereich (`print:block hidden`) enthaelt:
  - Fahrschul-Titel/Logo-Bereich
  - Datum der Tagesabrechnung
  - Vollstaendige Tabelle (ungefiltert)
  - Summen nach Zahlungsart
  - Notizfeld-Inhalt
  - Unterschriftenfelder:
    ```
    Kassenpruefung durchgefuehrt von: ______________________
    Datum: ______________________
    Unterschrift: ______________________
    ```
- CSS `@media print` Regeln in der Komponente oder index.css:
  - Sidebar, Header etc. ausblenden
  - Nur den Druckbereich anzeigen
  - A4-optimiertes Layout

### Aenderung 2: `src/App.tsx`

- Import `Tagesabrechnung` aus `./pages/dashboard/Tagesabrechnung`
- Neue Route: `<Route path="tagesabrechnung" element={<Tagesabrechnung />} />`

### Aenderung 3: `src/components/AppSidebar.tsx`

- `FileText` Icon importieren (aus lucide-react)
- Neuen Eintrag in `finanzItems`:
  ```
  { title: "Tagesabrechnung", url: "/dashboard/tagesabrechnung", icon: FileText }
  ```

### Aenderung 4: `src/index.css` (Druck-Styles)

Print-Media-Query hinzufuegen:
```css
@media print {
  body * { visibility: hidden; }
  .print-area, .print-area * { visibility: visible; }
  .print-area { position: absolute; left: 0; top: 0; width: 100%; }
}
```

### Technische Details

**Supabase-Query fuer Tageszahlungen:**
```text
supabase
  .from("payments")
  .select("*, students(vorname, nachname, geburtsdatum)")
  .gte("datum", dayStart.toISOString())
  .lt("datum", dayEnd.toISOString())
  .order("datum", { ascending: true })
```
Dabei ist `dayStart` = Anfang des gewaehlten Tages, `dayEnd` = Anfang des naechsten Tages.

**State-Variablen:**
- `selectedDate: string` (YYYY-MM-DD)
- `submitted: boolean` (ob Abrechnung erstellt wurde)
- `notiz: string` (Kassenvermerk)
- `filterZahlungsart: string` (Alle/bar/ec/ueberweisung)

**Keine Datenbank-Aenderungen noetig** -- alle Daten kommen aus der bestehenden `payments`-Tabelle.

### Zusammenfassung

| Datei | Aenderung |
|-------|-----------|
| `Tagesabrechnung.tsx` | Neue Seite mit Datumsauswahl, Zahlungstabelle, Summen, Notizfeld, Druckfunktion |
| `App.tsx` | Route `/dashboard/tagesabrechnung` hinzufuegen |
| `AppSidebar.tsx` | Navigationseintrag "Tagesabrechnung" in Finanzen |
| `index.css` | Print-Media-Query fuer sauberen PDF-Export |

