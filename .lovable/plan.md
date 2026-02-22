

## Fahrschule-Feld fuer Schueler hinzufuegen

### Uebersicht
Ein neues Pflichtfeld "Fahrschule" wird zur Schueler-Verwaltung hinzugefuegt, damit jeder Schueler einer der zwei Filialen zugeordnet werden kann. Zusaetzlich wird ein Filter in der Schuelerliste eingefuegt.

### 1. Datenbank-Migration

Neue Spalte `fahrschule` in der Tabelle `students`:
- Typ: `text`, NOT NULL, Default: `'riemke'`
- Erlaubte Werte: `'riemke'` und `'rathaus'`

```sql
ALTER TABLE students
ADD COLUMN fahrschule text NOT NULL DEFAULT 'riemke';
```

Der Default-Wert stellt sicher, dass bestehende Schueler keinen Fehler verursachen.

### 2. Aenderungen in `src/pages/dashboard/Fahrschueler.tsx`

**Neues Formularfeld im "Neuer Schueler"-Dialog:**
- Select-Dropdown "Fahrschule *" mit zwei Optionen:
  - "Miro-Drive (Riemke Markt)" (Wert: `riemke`)
  - "Miro-Drive (Rathaus)" (Wert: `rathaus`)
- Platzierung: nach Fuehrerscheinklasse, vor Adresse
- Default-Wert im Formular: `riemke`

**Filter in der Schuelerliste:**
- Neuer `useState` fuer `filterFahrschule` mit Optionen: "Alle", "Riemke Markt", "Rathaus"
- Filter-Buttons oder Select neben der Suchleiste
- Die gefilterte Liste beruecksichtigt sowohl Suchtext als auch Fahrschul-Filter

**Anzeige in der Tabelle:**
- Neue Spalte "Fahrschule" im Table-Header
- Badge-Anzeige pro Zeile: "Riemke Markt" oder "Rathaus"

**Student-Type erweitern:**
- `fahrschule: string` zum lokalen `Student`-Type hinzufuegen

**Insert-Mutation erweitern:**
- `fahrschule: values.fahrschule` in den Insert aufnehmen

**defaultForm erweitern:**
- `fahrschule: "riemke"` als neues Feld

### 3. Aenderungen in `src/pages/dashboard/FahrschuelerDetail.tsx`

- Fahrschule im Profil-Header anzeigen (z.B. als Badge neben Fuehrerscheinklasse)
- Label-Mapping: `riemke` -> "Miro-Drive (Riemke Markt)", `rathaus` -> "Miro-Drive (Rathaus)"

### Visuelles Ergebnis

**Schuelerliste mit Filter:**
```text
[Suche...]     [Alle | Riemke Markt | Rathaus]     12 Schueler

Name          | Klasse | Fahrschule     | Umschreiber | Saldo
Mustermann, M | B      | Riemke Markt   | -           | 482,00 EUR
```

**Neuer-Schueler-Dialog (neues Feld):**
```text
Telefon              Fuehrerscheinklasse *
[+49...]             [Klasse B v]

Fahrschule *
[Miro-Drive (Riemke Markt) v]
```

