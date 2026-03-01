

## Gutschrift-Option im Schuelerprofil-Zahlungsdialog

### Uebersicht

Der bestehende Zahlungsdialog im Schuelerprofil (`FahrschuelerDetail.tsx`) wird um die gleiche Gutschrift-Funktion erweitert, die bereits auf der Zahlungen-Seite existiert.

### Aenderungen

**Datei: `src/pages/dashboard/FahrschuelerDetail.tsx`**

**1. Form-State erweitern**

`fsZahlung` bekommt ein neues Feld `istGutschrift: boolean` (Default: `false`). Reset beim Schliessen des Dialogs wird entsprechend angepasst.

**2. Gutschrift-Checkbox im Dialog**

Oberhalb der Formularfelder wird eine Checkbox "Gutschrift" eingefuegt (identisch zur Zahlungen-Seite). Wenn aktiviert:
- Dialog-Titel wechselt zu "Gutschrift erfassen"
- Offene-Posten-Sektion wird ausgeblendet
- `selectedOpenItems` wird geleert

**3. Mutation anpassen**

`mutZahlung` wird erweitert: Wenn `istGutschrift === true`:
- Betrag wird als negativer Wert gespeichert (`-Math.abs(betrag)`)
- Keine Zuordnung zu offenen Posten
- Zusaetzlicher `open_items`-Eintrag mit negativem `betrag_gesamt`, Typ `'gutschrift'`, Status `'bezahlt'` wird erstellt (reduziert den Saldo)

**4. Invalidierung**

Nach Speichern werden zusaetzlich `open_items` invalidiert, damit der Saldo sofort aktualisiert wird (ist bereits vorhanden).

### Betroffene Dateien

| Datei | Aenderung |
|-------|-----------|
| `src/pages/dashboard/FahrschuelerDetail.tsx` | `fsZahlung` um `istGutschrift` erweitern, Checkbox im Dialog, Mutation fuer Gutschrift-Logik |

