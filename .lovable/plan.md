## Problem
In `src/pages/dashboard/Schnellerfassung.tsx` filtert die Query mit `.neq("status", "archiviert")`. Da 452 Fahrschüler `status = NULL` haben, werden diese in Postgres nicht als „ungleich archiviert" gewertet (NULL-Vergleich ergibt NULL) → die Liste ist leer.

## Fix
Eine Zeile in der `students_schnellerfassung`-Query anpassen:

```ts
supabase
  .from("students")
  .select("id, vorname, nachname, geburtsdatum, fahrschule, fuehrerscheinklasse, status")
  .or("status.is.null,status.neq.archiviert")
  .order("nachname")
```

Damit werden sowohl NULL-Status als auch alle nicht-archivierten Schüler angezeigt.

## Verifikation
- `/dashboard/schnellerfassung` zeigt links alle ~452 Fahrschüler.
- Paginierung funktioniert weiterhin.
- Archivierte Schüler (1) bleiben ausgeblendet.
