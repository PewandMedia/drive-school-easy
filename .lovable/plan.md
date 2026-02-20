
## Fahrlehrer-Statistik Seite

Neue Dashboard-Seite unter `/dashboard/fahrlehrer-statistik`, die pro Fahrlehrer die Fahrpruefungs-Statistik anzeigt.

### Neue Datei: `src/pages/dashboard/FahrlehrerStatistik.tsx`

Die Seite laedt zwei Queries parallel:
1. **Aktive Fahrlehrer** aus `instructors` (alle, auch inaktive, damit historische Daten sichtbar bleiben)
2. **Alle Fahrpruefungen** aus `exams` mit Filter `typ = 'praxis'` und `instructor_id IS NOT NULL`

Daraus wird pro Fahrlehrer berechnet:
- Gesamt (Anzahl Pruefungen)
- Bestanden
- Nicht bestanden
- Durchfallquote in %

**UI-Aufbau:**
- `PageHeader` mit Titel "Fahrlehrer-Statistik" und Icon `UserCheck` (lucide)
- Tabelle mit Spalten: Fahrlehrer | Gesamt | Bestanden | Nicht bestanden | Durchfallquote | Progressbar
- Durchfallquote als Prozentwert + farbige Progressbar (gruen bei niedriger Quote, rot bei hoher)
- Leer-Zustand wenn keine Daten vorhanden

### Aenderung: `src/App.tsx`

Neue Route hinzufuegen:
```text
<Route path="fahrlehrer-statistik" element={<FahrlehrerStatistik />} />
```

### Aenderung: `src/components/AppSidebar.tsx`

Neuen Navigationspunkt in der Gruppe "Schueler & Ausbildung" (oder alternativ bei "Verwaltung") einfuegen:
```text
{ title: "Fahrlehrer-Statistik", url: "/dashboard/fahrlehrer-statistik", icon: UserCheck }
```

### Technische Details

- Beide Queries (`instructors`, `exams`) werden mit `useQuery` geladen
- Berechnung per `useMemo`: Gruppierung der Exams nach `instructor_id`, dann Mapping auf Fahrlehrer-Namen
- Progress-Komponente aus `@/components/ui/progress` fuer die Durchfallquote
- Farbgebung der Progressbar: CSS-Klasse basierend auf Prozentwert (z.B. unter 20% gruen, 20-50% gelb, ueber 50% rot)
- Bestehende Design-Patterns (Card-Style, Tabelle, PageHeader) werden wiederverwendet
- Keine Datenbankaenderungen noetig
