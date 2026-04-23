

## Tagesabrechnung: Zwei separate Datums-Filter

### Problem
Aktuell werden alte Zahlungen ohne `einreichungsdatum` per Fallback dem `datum` zugeordnet — das verfälscht die Tagesabrechnung. Außerdem braucht man die Möglichkeit, sowohl nach Einreichungsdatum als auch nach Einnahmedatum zu filtern.

### Lösung

**1. Backfill rückgängig machen**
Alle `einreichungsdatum`-Werte, die durch die letzte Migration auf `datum` gesetzt wurden, wieder auf `NULL` setzen. Damit haben Altdaten kein Einreichungsdatum und tauchen nicht fälschlicherweise im Bürobericht auf.

```sql
-- Nur dort zurücksetzen, wo einreichungsdatum exakt gleich datum ist
-- (das war der Backfill der vorherigen Migration)
UPDATE payments 
SET einreichungsdatum = NULL 
WHERE einreichungsdatum = datum 
  AND created_at < '2026-04-23 16:00:00';
```

**2. Tagesabrechnung-UI: Zwei Filter-Modi**

Im Filter-Bereich oben werden zwei Datumsfelder angeboten:

- **Einreichungsdatum (Büro)** — Standard-Filter, zeigt was heute im Büro abgegeben wurde
- **Einnahmedatum (Fahrlehrer)** — alternativer Filter, zeigt was an einem bestimmten Tag vom Fahrlehrer kassiert wurde

Dazu ein Umschalter (Radio/Tabs) "Filtern nach: [Einreichung im Büro] [Einnahme beim Fahrlehrer]".

```text
┌─────────────────────────────────────────────────────────┐
│ Filtern nach:  ( ) Einreichung im Büro                  │
│                ( ) Einnahme beim Fahrlehrer             │
│                                                         │
│ Datum: [23.04.2026]   [Tagesabrechnung erstellen]      │
└─────────────────────────────────────────────────────────┘
```

**3. Query-Logik (kein Fallback mehr)**

- Modus "Einreichung": filtert strikt auf `einreichungsdatum` (NULL-Werte werden NICHT angezeigt)
- Modus "Einnahme": filtert strikt auf `datum`

So sind Altdaten ohne Einreichungsdatum nur im "Einnahme"-Modus sichtbar — niemals fälschlich im Bürobericht.

**4. Tabelle bleibt gleich**
Beide Spalten "Einnahme am" und "Einreichung am" bleiben sichtbar (Einreichung zeigt "–" wenn NULL). Der Header der Seite passt sich an den gewählten Modus an.

### Technische Details

| Datei | Änderung |
|---|---|
| Migration | `UPDATE payments SET einreichungsdatum = NULL` für Backfill-Reset (alte Daten ohne echtes Einreichungsdatum) |
| `Tagesabrechnung.tsx` | State `filterModus: "einreichung" \| "einnahme"`; Query strikt nach gewähltem Feld filtern (kein OR-Fallback mehr); UI um Modus-Umschalter ergänzen; PageHeader-Description und PDF-Header dynamisch |

### Verhalten

| Fall | Modus "Einreichung" 23.04. | Modus "Einnahme" 23.04. |
|---|---|---|
| Zahlung mit Einnahme 20.04., Einreichung 23.04. | ✅ angezeigt | ❌ nicht angezeigt |
| Zahlung mit Einnahme 23.04., Einreichung 23.04. | ✅ angezeigt | ✅ angezeigt |
| Alte Zahlung mit Einnahme 23.04., Einreichung NULL | ❌ nicht angezeigt | ✅ angezeigt |

