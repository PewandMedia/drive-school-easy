

## Pruefungen-Modal um Fahrlehrer-Auswahl erweitern

### Aenderungen in `src/pages/dashboard/Pruefungen.tsx`

#### 1. Instructors-Query hinzufuegen

Neue `useQuery` fuer aktive Fahrlehrer:
```text
supabase.from("instructors").select("id, vorname, nachname").eq("aktiv", true).order("nachname")
```

#### 2. ExamForm-Typ erweitern

Neues Feld `instructor_id: string` im `ExamForm`-Typ und in `defaultForm()` (default: `""`).

#### 3. Bedingtes Fahrlehrer-Dropdown im Dialog

Zwischen dem Pruefungstyp-Select und dem Fahrzeug-Select wird ein neues Feld eingefuegt:

- Nur sichtbar wenn `form.typ === "praxis"`
- Select-Dropdown mit allen aktiven Fahrlehrern (Nachname, Vorname)
- Pflichtfeld: `canSave` wird erweitert um `(form.typ === "praxis" ? !!form.instructor_id : true)`

#### 4. instructor_id beim Reset zuruecksetzen

Wenn der Pruefungstyp auf "theorie" wechselt, wird `instructor_id` automatisch auf `""` gesetzt (per useEffect oder inline im onValueChange).

#### 5. Mutation erweitern

Im `saveMutation` wird `instructor_id` mitgeschickt:
```text
instructor_id: form.typ === "praxis" ? form.instructor_id : null
```

### Keine DB-Aenderungen noetig

Die Spalte `instructor_id` und der Validierungs-Trigger existieren bereits.

### Betroffene Datei

| Datei | Aenderung |
|---|---|
| `src/pages/dashboard/Pruefungen.tsx` | Query, Form, Dialog, Mutation erweitern |

