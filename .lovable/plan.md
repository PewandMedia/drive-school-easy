

## Fix: Supabase 1000-Zeilen-Limit richtig umgehen

### Problem

Das Supabase PostgREST-Backend hat serverseitig ein `max_rows`-Limit von 1000. Der Client-Parameter `.limit(10000)` wird vom Server ignoriert -- es kommen maximal 1000 Zeilen zurueck. Das betrifft:

- **Statistik-Cards**: Zeigen falsche Zahlen (z.B. "1000" statt 1208 Fahrstunden)
- **"Mehr anzeigen"-Buttons**: Zeigen "von 1000" statt der echten Gesamtzahl
- **Saldo-Berechnungen**: Unvollstaendig weil nicht alle Daten geladen werden

### Loesung: Paginated Fetching

Eine Hilfsfunktion `fetchAll()` wird erstellt, die automatisch in 1000er-Batches alle Daten aus einer Tabelle laedt. Die Funktion ruft `.range(0, 999)`, `.range(1000, 1999)` usw. auf, bis keine weiteren Daten mehr kommen.

```text
async function fetchAll(query):
  allData = []
  page = 0
  while true:
    data = query.range(page * 1000, (page + 1) * 1000 - 1)
    allData.push(...data)
    if data.length < 1000: break
    page++
  return allData
```

### Betroffene Dateien und Aenderungen

**Neue Datei: `src/lib/fetchAllRows.ts`**
- Exportiert eine generische `fetchAllRows()` Funktion
- Nimmt einen Supabase-Query-Builder entgegen
- Gibt alle Zeilen zurueck, egal wie viele es sind
- Entfernt das bisherige `.limit(10000)` Problem komplett

**Alle 9 Dashboard-Dateien werden angepasst:**

| Datei | Queries die umgestellt werden |
|-------|------------------------------|
| `Dashboard.tsx` | students, driving_lessons, exams, theory_sessions, services, payments (6 Queries) |
| `Fahrstunden.tsx` | students, driving_lessons (2 Queries) |
| `Schaltstunden.tsx` | driving_lessons (1 Query, students bleibt da B197-Filter < 1000) |
| `Theorie.tsx` | students, theory_sessions (2 Queries) |
| `Pruefungen.tsx` | exams, students (2 Queries) |
| `Leistungen.tsx` | services, students (2 Queries) |
| `Zahlungen.tsx` | payments, payment_allocations, students (3 Queries) |
| `Fahrschueler.tsx` | students, driving_lessons, exams, services, payments (5 Queries) |
| `Abrechnung.tsx` | students, open_items (2 Queries) |

Bei jeder Query wird `.limit(10000)` entfernt und stattdessen `fetchAllRows()` verwendet.

### Technisches Detail

Die `fetchAllRows` Funktion nutzt die Supabase `.range()` Methode:

```text
Aufruf: fetchAllRows(supabase.from("driving_lessons").select("*").order("datum", { ascending: false }))

Intern:
  Batch 1: .range(0, 999)    -> 1000 Zeilen
  Batch 2: .range(1000, 1999) -> 208 Zeilen
  Fertig: 1208 Zeilen total
```

### Zusammenfassung

| Aenderung | Details |
|-----------|---------|
| Neue Datei `src/lib/fetchAllRows.ts` | Generische Paginated-Fetch-Funktion |
| 9 Dashboard-Dateien | Alle `.limit(10000)` Queries durch `fetchAllRows()` ersetzen |
| Ergebnis | Korrekte Statistik-Zahlen, korrekte "von X" Anzeigen, korrekte Saldo-Berechnungen |

