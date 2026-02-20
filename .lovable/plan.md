

## Pruefungen-Seite: Filter nach Pruefungstyp

### Aenderungen in `src/pages/dashboard/Pruefungen.tsx`

#### 1. URL-basierter Filterstate

- `useSearchParams` aus `react-router-dom` importieren
- Filterwert aus URL-Parameter `typ` lesen (default: `"all"`)
- Setter aktualisiert den URL-Parameter (`setSearchParams`)

#### 2. Filter-Dropdown oberhalb der Tabelle

Zwischen den Statistik-Karten und der Tabelle wird ein Filterbereich eingefuegt:

- Select-Dropdown mit drei Optionen: "Alle Pruefungen", "Theoriepruefung", "Fahpruefung"
- Icon: `Filter` aus lucide-react

#### 3. Gefilterte Daten

Neue Variable `filtered` per `useMemo`:

```text
all    -> exams (unveraendert)
theorie -> exams.filter(e => e.typ === "theorie")
praxis  -> exams.filter(e => e.typ === "praxis")
```

#### 4. Statistik-Karten dynamisch

Die drei Statistik-Karten (Gesamt, Bestanden, Nicht bestanden) rechnen auf `filtered` statt auf `exams`.

#### 5. Tabelle nutzt `filtered`

Die Tabellen-Schleife iteriert ueber `filtered` statt `exams`. Die Leer-Pruefung nutzt ebenfalls `filtered.length`.

### Neue Imports

- `useSearchParams` aus `react-router-dom`
- `useMemo` aus `react`
- `Filter` Icon aus `lucide-react`

### Keine weiteren Dateien betroffen

Alle Aenderungen erfolgen ausschliesslich in `Pruefungen.tsx`. Keine DB-Aenderungen noetig.

