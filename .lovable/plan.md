

## Einreichungsdatum entfernen — zurück zum einfachen Datum

Das Einreichungsdatum-Feld wird aus allen Formularen und der Tagesabrechnung entfernt. Alles basiert wieder nur auf dem normalen `datum`-Feld.

### Änderungen

**1. `src/pages/dashboard/Zahlungen.tsx`**
- `einreichungsdatum` aus dem `PaymentForm`-Type und Default-State entfernen
- `einreichungsdatum` aus dem Insert-Objekt entfernen
- Das "Einreichungsdatum (Büro)"-Eingabefeld im Dialog entfernen

**2. `src/pages/dashboard/FahrschuelerDetail.tsx`**
- `einreichungsdatum` aus dem `fsZahlung`-State und allen Resets entfernen
- `einreichungsdatum` aus dem Insert-Objekt entfernen
- Das "Einreichungsdatum (Büro)"-Eingabefeld im Zahlungsdialog entfernen

**3. `src/pages/dashboard/Tagesabrechnung.tsx`**
- Query: Filter und Select von `einreichungsdatum` → `datum` umstellen
- `einreichungsdatum` aus dem `PaymentRow`-Type entfernen
- Tabelle: "Eingereicht am"-Spalte entfernen, nur noch "Datum" anzeigen
- Print-Bereich: "Eingereicht am"-Spalte ebenfalls entfernen
- Spaltenüberschrift "Einnahmedatum" → "Datum" umbenennen

| Datei | Änderung |
|---|---|
| `Zahlungen.tsx` | Einreichungsdatum-Feld und State entfernen |
| `FahrschuelerDetail.tsx` | Einreichungsdatum-Feld und State entfernen |
| `Tagesabrechnung.tsx` | Filter auf `datum`, "Eingereicht am"-Spalte entfernen |

Keine Datenbank-Änderung nötig — die Spalte `einreichungsdatum` bleibt in der DB bestehen, wird nur nicht mehr genutzt.

