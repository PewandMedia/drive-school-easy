

## Tagesabrechnung mit Einreichungsdatum

Das System braucht ein zweites Datum pro Zahlung: das **Einreichungsdatum** (wann das Geld im Büro abgegeben wurde), getrennt vom bestehenden **Zahlungsdatum** (wann der Fahrlehrer das Geld vom Schüler erhalten hat).

### Änderungen

**1. Datenbank-Migration — Neue Spalte `einreichungsdatum`**
- `ALTER TABLE payments ADD COLUMN einreichungsdatum timestamptz DEFAULT now()`
- Bestehende Zahlungen: `einreichungsdatum` wird automatisch auf `now()` gesetzt (Default)
- Rückwirkend bestehende Daten mit `datum`-Wert befüllen: `UPDATE payments SET einreichungsdatum = datum WHERE einreichungsdatum IS NULL`

**2. `src/pages/dashboard/Zahlungen.tsx` — Einreichungsdatum im Formular**
- Neues Feld "Einreichungsdatum (Büro)" im Zahlungsformular, Default: heute
- Beim Speichern wird `einreichungsdatum` mitgeschickt
- In der Zahlungsliste beide Daten anzeigen

**3. `src/pages/dashboard/FahrschuelerDetail.tsx` — Einreichungsdatum bei Zahlungserfassung**
- Ebenfalls neues Feld "Einreichungsdatum" im Zahlungsdialog

**4. `src/pages/dashboard/Tagesabrechnung.tsx` — Filter nach Einreichungsdatum**
- Query filtert nach `einreichungsdatum` statt `datum`
- Tabelle zeigt beide Daten: "Einnahmedatum" (= `datum`) und "Eingereicht am" (= `einreichungsdatum`)
- Print-Bereich ebenfalls aktualisiert

### Dateien

| Datei | Änderung |
|---|---|
| Migration (SQL) | Neue Spalte `einreichungsdatum` auf `payments` |
| `Tagesabrechnung.tsx` | Filter auf `einreichungsdatum`, beide Daten in Tabelle anzeigen |
| `Zahlungen.tsx` | Einreichungsdatum-Feld im Formular, Spalte in Liste |
| `FahrschuelerDetail.tsx` | Einreichungsdatum-Feld im Zahlungsdialog |

