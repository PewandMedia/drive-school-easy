

## Sektions-Aktionsbuttons im Schuelerprofil verbessern

### Uebersicht
Die bestehenden kleinen Icon-only "+"-Buttons in den Sektions-Headern werden durch beschriftete, dezente Buttons im Primary-Stil ersetzt. Zusaetzlich erhalten die Sektionen "Fahrstunden Uebersicht" und "Theorieunterricht" erstmals eigene Buttons.

### Aenderungen in `src/pages/dashboard/FahrschuelerDetail.tsx`

**1. `SectionPlusBtn`-Komponente ersetzen**
Die bestehende Icon-only-Komponente (Zeile 420-424) wird durch eine beschriftete Button-Variante ersetzt:
- Stil: `variant="outline"`, kleiner (`size="sm"`), mit Primary-Textfarbe und dezenter Primary-Border
- Klassen: `text-xs h-7 px-2.5 border-primary/30 text-primary hover:bg-primary/10 hover:text-primary`
- Jeder Button bekommt ein eigenes Label als Prop

**2. Buttons in allen 5 Sektionen platzieren**

| Sektion | Button-Label | Oeffnet Dialog |
|---------|-------------|----------------|
| Fahrstunden Uebersicht (Zeile ~626) | + Fahrstunde hinzufuegen | `dlgFahrstunde` |
| Theorieunterricht (Zeile ~711) | + Theoriestunde hinzufuegen | `dlgTheorie` |
| Pruefungen (Zeile ~838) | + Pruefung eintragen | `dlgPruefung` |
| Leistungen (Zeile ~928) | + Leistung hinzufuegen | `dlgLeistung` |
| Zahlungen (Zeile ~969) | + Zahlung hinzufuegen | `dlgZahlung` |

**3. Konkrete Code-Aenderungen**

- **SectionPlusBtn** wird zu `SectionAddBtn` mit `label`-Prop und `onClick`-Prop
- **Fahrstunden Uebersicht** (Zeile 631): Neben "Alle Pflichtfahrten absolviert" wird der Button eingefuegt
- **Theorieunterricht** (Zeile 716): Neben "Pflicht erfuellt" wird der Button eingefuegt
- **Pruefungen** (Zeile 838): Bestehender `SectionPlusBtn` wird durch `SectionAddBtn` ersetzt
- **Fahrstunden-Liste** (Zeile 891): Wird entfernt, da Fahrstunden Uebersicht bereits den Button hat
- **Leistungen** (Zeile 928): Bestehender `SectionPlusBtn` wird durch `SectionAddBtn` ersetzt
- **Zahlungen** (Zeile 969): Bestehender `SectionPlusBtn` wird durch `SectionAddBtn` ersetzt

**4. Globaler Button bleibt unberuehrt**
Der "Aktion hinzufuegen"-Dropdown im Header (Zeile 476-504) bleibt vollstaendig erhalten.

### Visuelles Ergebnis

```text
Fahrstunden Uebersicht                    [+ Fahrstunde hinzufuegen]
Theorieunterricht                         [+ Theoriestunde hinzufuegen]
Pruefungen (2)                            [+ Pruefung eintragen]
Leistungen (3)                            [+ Leistung hinzufuegen]
Zahlungen (1)                             [+ Zahlung hinzufuegen]
```

Buttons sind kleiner als der globale Header-Button, nutzen die Primary-Farbe (gelb) aber als Outline-Variante fuer einen dezenteren Look.

