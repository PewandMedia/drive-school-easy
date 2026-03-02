

## Fahrlehrer-Auswahl nach Speichern beibehalten

### Problem
Beim Eintragen mehrerer Fahrstunden hintereinander wird der Fahrlehrer nach jedem Speichern zurueckgesetzt, sodass er jedes Mal neu gewaehlt werden muss.

### Loesung
Im `onSuccess`-Callback der Fahrstunden-Mutation wird beim Zuruecksetzen des Formulars der aktuelle `instructor_id`-Wert beibehalten statt ihn auf `""` zu setzen.

### Aenderung

| Datei | Aenderung |
|-------|-----------|
| `src/pages/dashboard/FahrschuelerDetail.tsx` (Zeile ~287) | `instructor_id` im Reset auf den aktuellen Wert setzen statt `""` |

Konkret wird aus:
```typescript
setFsFahrstunde({ typ: "uebungsstunde", fahrzeug_typ: "automatik", instructor_id: "", dauer_minuten: 45, datum: ... });
```

Dies:
```typescript
setFsFahrstunde(prev => ({ typ: "uebungsstunde", fahrzeug_typ: "automatik", instructor_id: prev.instructor_id, dauer_minuten: 45, datum: ... }));
```

Eine Zeile Aenderung.

