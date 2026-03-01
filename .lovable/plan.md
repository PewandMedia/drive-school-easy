

## Tagesabrechnung: Filter auf PDF und Summen anwenden

### Problem

Drei Stellen ignorieren den aktiven Zahlungsart-Filter:

1. **Summen-Berechnung (`totals`)** -- basiert auf `payments` (alle), nicht auf `filteredPayments`
2. **Summary-Karten** -- zeigen immer alle Zahlungsarten, auch wenn gefiltert
3. **PDF-Druckbereich** -- rendert `payments` statt `filteredPayments`

### Loesung

**Datei: `src/pages/dashboard/Tagesabrechnung.tsx`**

1. **`totals` auf `filteredPayments` umstellen**: Die `useMemo`-Abhaengigkeit von `payments` auf `filteredPayments` aendern, sodass Betraege und Anzahlen nur die gefilterten Zahlungen widerspiegeln.

2. **Summary-Karten dynamisch anpassen**: Wenn ein Filter aktiv ist (z.B. "bar"), nur die relevante Karte plus Gesamt anzeigen -- oder alternativ alle Karten anzeigen, aber mit den gefilterten Werten (da `totals` jetzt auf `filteredPayments` basiert, passiert das automatisch).

3. **PDF-Druckbereich**: `payments.map(...)` durch `filteredPayments.map(...)` ersetzen. Die Summen im Druckbereich ebenfalls auf die gefilterten `totals` umstellen. Nur Zahlungsart-Zeilen anzeigen, die im Filter enthalten sind.

4. **Filter-Hinweis im PDF**: Wenn ein Filter aktiv ist, einen Hinweis im PDF-Header anzeigen (z.B. "Filter: Nur Barzahlungen"), damit klar ist, dass es sich um einen Teilbericht handelt.

### Betroffene Stellen

| Zeile(n) | Aenderung |
|----------|-----------|
| 86-96 | `totals` basiert auf `filteredPayments` statt `payments` |
| 103-108 | `summaryCards` nutzt automatisch korrekte Werte |
| 144-167 | TableFooter-Logik: bei aktivem Filter nur eine Summenzeile |
| 268-301 | Print-Bereich: `filteredPayments` statt `payments`, Summen filtern |
| 264 | Filter-Hinweis im PDF-Header |

