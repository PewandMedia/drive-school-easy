

## Bugfix: Tagesabrechnung zeigt keine Daten

### Problem
Die Query in `Tagesabrechnung.tsx` versucht über `instructors(vorname, nachname)` einen Join, aber zwischen `payments.instructor_id` und `instructors.id` existiert kein Foreign Key. Dadurch schlägt die gesamte Query mit `PGRST200` fehl und es werden keine Zahlungen geladen.

### Lösung

**1. Datenbank-Migration: Foreign Key hinzufügen**

```sql
ALTER TABLE public.payments
  ADD CONSTRAINT payments_instructor_id_fkey
  FOREIGN KEY (instructor_id) REFERENCES public.instructors(id) ON DELETE SET NULL;
```

Das löst auch gleich den Hinweis aus dem Plan (Foreign Keys fehlen generell — wir reparieren hier nur den, der den Bug verursacht).

### Technische Details

| Datei | Änderung |
|---|---|
| Migration | FK `payments.instructor_id → instructors.id` ergänzen, damit PostgREST den Embed `instructors(vorname, nachname)` auflösen kann |

Nach der Migration funktioniert die bestehende Query in `Tagesabrechnung.tsx` ohne Code-Änderung. Die 10 vorhandenen Zahlungen mit Einreichungsdatum 23.04.2026 werden dann sofort angezeigt.

