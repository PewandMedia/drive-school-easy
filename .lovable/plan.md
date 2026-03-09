

## Test-Account "test tes" komplett loeschen

Der Schueler (ID: `e225cc6d-fdd1-4f65-bb89-d53afd9d47da`) hat:
- 2 Services (Grundbetrag, Lernmaterial)
- 2 Offene Posten
- Keine Fahrstunden, Theorie, Pruefungen, Zahlungen

### SQL-Migration

Reihenfolge (wegen Foreign Keys / Trigger):
1. `payment_allocations` loeschen (fuer open_items des Schuelers)
2. `open_items` loeschen
3. `services` loeschen
4. `students` Datensatz loeschen

Eine einzige Migration mit DELETE-Statements in der richtigen Reihenfolge.

| Aenderung | Details |
|---|---|
| DB-Migration | Alle Daten des Schuelers `e225cc6d-...` loeschen |

