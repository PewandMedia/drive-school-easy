

## Einreichungsdatum für bestehende Zahlungen korrigieren

### Problem
Die Migration hat `einreichungsdatum` mit `DEFAULT now()` angelegt, wodurch alle bestehenden Zahlungen den Migrationszeitpunkt (22.03.2026 10:42) als Einreichungsdatum bekommen haben statt ihr ursprüngliches Einnahmedatum.

### Lösung
Ein einziges SQL-Update: Alle Zahlungen, deren `einreichungsdatum` auf den Migrationszeitpunkt gesetzt ist (`2026-03-22 10:42:28.736478+00`), werden auf ihr jeweiliges `datum` (Einnahmedatum) korrigiert.

```sql
UPDATE payments 
SET einreichungsdatum = datum 
WHERE einreichungsdatum = '2026-03-22 10:42:28.736478+00'
```

Keine Code-Änderungen nötig. Ab jetzt wird das Einreichungsdatum bei neuen Zahlungen vom Benutzer manuell eingetragen.

| Aktion | Detail |
|---|---|
| Daten-Update (SQL) | `einreichungsdatum = datum` für alle Altdaten mit Migrationszeitpunkt |

