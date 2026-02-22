

## Geburtsdatum-Feld fuer Fahrschueler hinzufuegen

### Uebersicht
Das Feld `geburtsdatum` (date, Pflicht) wird zur `students`-Tabelle hinzugefuegt. Ueberall im System wird der Name einheitlich als **"Nachname, Vorname (TT.MM.JJJJ)"** dargestellt -- in Listen, Dropdowns und Profilansichten.

### 1. Datenbank-Migration

```sql
ALTER TABLE students
ADD COLUMN geburtsdatum date;
```

Die Spalte wird zunaechst nullable angelegt, damit bestehende Schueler keinen Fehler verursachen. Im Formular wird das Feld als Pflicht validiert.

### 2. Hilfsfunktion fuer einheitliche Namensanzeige

Eine kleine Utility-Funktion wird erstellt, die ueberall wiederverwendet wird:

```typescript
// z.B. in einer Datei oder inline
const formatStudentName = (nachname: string, vorname: string, geburtsdatum?: string | null) => {
  if (geburtsdatum) {
    return `${nachname}, ${vorname} (${format(new Date(geburtsdatum), "dd.MM.yyyy")})`;
  }
  return `${nachname}, ${vorname}`;
};
```

### 3. Aenderungen pro Datei

**`src/pages/dashboard/Fahrschueler.tsx`** -- Schuelerliste
- Student-Type um `geburtsdatum: string | null` erweitern
- defaultForm um `geburtsdatum: ""` erweitern
- Datepicker-Feld "Geburtsdatum *" im Anlege-Dialog hinzufuegen
- Validierung: Geburtsdatum darf nicht leer sein
- Neue Spalte "Geb.-Datum" in der Tabelle (grid-cols anpassen)
- Namensanzeige in Zeilen: `Nachname, Vorname (TT.MM.JJJJ)`
- Insert-Mutation: `geburtsdatum` mitsenden

**`src/pages/dashboard/FahrschuelerDetail.tsx`** -- Schueler-Profil
- Geburtsdatum im Profil-Header anzeigen (neben E-Mail, Telefon etc.)
- Name im Header: `Nachname, Vorname`
- Geburtsdatum als eigenes Info-Feld mit Calendar-Icon

**`src/pages/dashboard/Fahrstunden.tsx`** -- Fahrstunden-Seite
- Schueler-Query um `geburtsdatum` erweitern
- Dropdown: `Nachname, Vorname (TT.MM.JJJJ)`
- Tabellen-Anzeige: `Nachname, Vorname (TT.MM.JJJJ)`

**`src/pages/dashboard/Pruefungen.tsx`** -- Pruefungen
- `students(vorname, nachname, fuehrerscheinklasse)` um `geburtsdatum` erweitern
- Schueler-Dropdown und Tabelle: `Nachname, Vorname (TT.MM.JJJJ)`

**`src/pages/dashboard/Leistungen.tsx`** -- Leistungen
- `students(vorname, nachname)` um `geburtsdatum` erweitern
- Schueler-Dropdown und gruppierte Ansicht: `Nachname, Vorname (TT.MM.JJJJ)`

**`src/pages/dashboard/Zahlungen.tsx`** -- Zahlungen
- `students(vorname, nachname)` um `geburtsdatum` erweitern
- Schueler-Dropdown und Tabelle: `Nachname, Vorname (TT.MM.JJJJ)`

**`src/pages/dashboard/Theorie.tsx`** -- Theorie
- Schueler-Query um `geburtsdatum` erweitern
- studentMap und Dropdowns: `Nachname, Vorname (TT.MM.JJJJ)`

**`src/pages/dashboard/Schaltstunden.tsx`** -- Schaltstunden
- Schueler-Query um `geburtsdatum` erweitern
- studentMap und Dropdowns: `Nachname, Vorname (TT.MM.JJJJ)`

**`src/pages/dashboard/Abrechnung.tsx`** -- Abrechnung
- Name in der Tabelle: `Nachname, Vorname (TT.MM.JJJJ)`

**`src/pages/dashboard/Dashboard.tsx`** -- Dashboard-Uebersicht
- nameMap und Saldo-Liste: `Nachname, Vorname (TT.MM.JJJJ)`

### 4. Einheitliches Namensformat

Ueberall im System gilt ab sofort:

| Kontext | Format |
|---------|--------|
| Listen-Zeilen | Nachname, Vorname (TT.MM.JJJJ) |
| Dropdowns / Select | Nachname, Vorname (TT.MM.JJJJ) |
| Profil-Header | Nachname, Vorname (Geburtsdatum separat als Info-Zeile) |
| Dashboard-Aktivitaeten | Nachname, Vorname (TT.MM.JJJJ) |

### 5. Datepicker-Implementierung

Im Anlege-Dialog wird ein Popover-basierter Datepicker (Shadcn Calendar) verwendet mit `pointer-events-auto` fuer korrekte Interaktion im Dialog.

