

## Offene Posten im Saldo-Bereich anzeigen

### Problem
Der Bereich "Uebersicht / Saldo" im Schuelerprofil zeigt nur drei Zeilen: Forderungen gesamt, Davon bezahlt, Offener Saldo. Man sieht nicht, welche konkreten Posten noch offen sind.

### Loesung
Unter der Saldo-Zusammenfassung eine aufklappbare oder direkt sichtbare Liste aller offenen/teilbezahlten Posten anzeigen.

### Aenderung: `src/pages/dashboard/FahrschuelerDetail.tsx`

Im Bereich "Uebersicht / Saldo" (ca. Zeilen 627-649) wird nach dem Saldo-Block eine Liste der offenen Posten eingefuegt:

**Neue Anzeige unter dem Saldo:**

- Ueberschrift: "Offene Posten" (nur wenn welche vorhanden)
- Liste aller `openItems` mit `status !== "bezahlt"`, sortiert nach Datum
- Pro Eintrag:
  - Datum (formatiert)
  - Beschreibung (z.B. "Fahrstunde 90min (2E)")
  - Offener Betrag (betrag_gesamt - betrag_bezahlt)
  - Bei Teilzahlung: kleiner Hinweis z.B. "von 130,00 EUR"
- Farbcodierung: Status-Badge (offen = amber, teilbezahlt = orange)

**Aufbau:**
```text
UEBERSICHT / SALDO
Forderungen gesamt              792,00 EUR
Davon bezahlt                  -352,00 EUR
─────────────────────────────────────────
Offener Saldo                   440,00 EUR

OFFENE POSTEN (3)
24.02.2026  Fahrstunde 90min     130,00 EUR  [offen]
24.02.2026  Theoriepruefung       85,00 EUR  [offen]
22.02.2026  Grundbetrag          225,00 EUR  [teilbezahlt: 74€ bezahlt]
```

### Zusammenfassung

| Datei | Aenderung |
|-------|-----------|
| FahrschuelerDetail.tsx | Liste offener Posten mit Datum, Beschreibung, Betrag und Status unter dem Saldo anzeigen |

