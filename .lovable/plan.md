# Supabase 1000-Zeilen-Limit überall entfernen

## Ziel
Sicherstellen, dass alle Dashboard-Seiten und Statistiken **alle** Datensätze aus Supabase laden – auch wenn die Tabelle mehr als 1000 Einträge enthält. Dafür wird der bereits vorhandene `fetchAllRows`-Helper (paginiert in 1000er-Blöcken via `.range()`) überall dort eingesetzt, wo Listen oder Aggregate gelesen werden.

## Befund (Audit)
Bereits korrekt (nutzen `fetchAllRows`):
- Dashboard, Abrechnung, Fahrschueler, Fahrstunden, Theorie (Sessions/Students), Pruefungen, Leistungen, Zahlungen, Auswertung, FahrlehrerStatistik (lessons + theory).

Noch **ohne** `fetchAllRows` – können bei Wachstum abgeschnitten werden:
1. `src/pages/dashboard/FahrlehrerStatistik.tsx`
   - `exams` (Praxis, mit instructor) – Statistik-relevant
   - `instructors`-Liste (klein, aber zur Konsistenz)
2. `src/pages/dashboard/Tagesabrechnung.tsx`
   - `payments` für den ausgewählten Tag (Tagessummen/Anzahl)
3. `src/pages/dashboard/Schaltstunden.tsx`
   - `students` (B197) – Liste
4. `src/pages/dashboard/FahrschuelerDetail.tsx` (pro Schüler, beeinflusst angezeigte Zahlen/Saldo):
   - driving_lessons, services, theory_sessions, exams, payments, prices, instructors, payment-IDs
5. `src/pages/dashboard/Theorie.tsx`, `Zahlungen.tsx`, `Benutzerverwaltung.tsx`
   - Referenzlisten (instructors, profiles, user_roles) – klein, aber zur Sicherheit ebenfalls umstellen

## Umsetzung
- Jede betroffene `useQuery`-`queryFn` so umbauen, dass die Supabase-Query in `fetchAllRows(...)` gewrappt wird, statt direkt `await`-ed zu werden.
- `import { fetchAllRows } from "@/lib/fetchAllRows";` wo nötig ergänzen.
- Fehlerbehandlung beibehalten (fetchAllRows wirft bei Fehler, React Query fängt das ab).
- Einzelsatz-Lookups (`.single()`, `.maybeSingle()`, `.eq("id", …)`) bleiben unverändert – dort gibt es kein Limit-Problem.
- Mutationen (insert/update/delete) bleiben unverändert.

## Technische Details
`fetchAllRows` paginiert in 1000er-Blöcken via `.range(from, to)` und bricht ab, sobald eine Seite < 1000 Zeilen liefert. Das umgeht den Supabase-Default-`max_rows`-Limit zuverlässig.

Beispiel-Refactor:
```ts
// vorher
const { data, error } = await supabase
  .from("exams")
  .select("instructor_id, datum, status")
  .eq("typ", "praxis")
  .not("instructor_id", "is", null);
if (error) throw error;
return data;

// nachher
return fetchAllRows(
  supabase
    .from("exams")
    .select("instructor_id, datum, status")
    .eq("typ", "praxis")
    .not("instructor_id", "is", null)
);
```

## Nicht enthalten
- Keine Schema-Änderungen, keine RLS-Änderungen.
- Keine UI-Änderungen.
- Keine Änderungen an Mutations- oder Auth-Logik.
