

## Fahrlehrer-Verwaltung: Hinzufuegen, Bearbeiten, Loeschen

### Uebersicht

Es wird eine wiederverwendbare Fahrlehrer-Verwaltungs-Komponente erstellt, die als Dialog (Popup) geoeffnet werden kann. Diese wird an zwei Stellen eingebunden:

1. **Pruefungen-Seite** (`Pruefungen.tsx`): Ein Edit-Icon neben dem Fahrlehrer-Dropdown (nur sichtbar bei Fahrpruefung)
2. **Fahrlehrer-Statistik** (`FahrlehrerStatistik.tsx`): Ein Button im PageHeader

### Neue Datei: `src/components/InstructorManageDialog.tsx`

Eine eigenstaendige Dialog-Komponente mit folgender Funktionalitaet:

**Ansicht: Liste**
- Tabelle aller Fahrlehrer (Vorname, Nachname, aktiv/inaktiv)
- Button "Neuen Fahrlehrer hinzufuegen"
- Pro Zeile: Bearbeiten-Icon und Loeschen-Icon

**Ansicht: Formular (Hinzufuegen/Bearbeiten)**
- Zwei Eingabefelder: Vorname und Nachname
- Speichern- und Abbrechen-Button
- Beim Bearbeiten werden die bestehenden Werte vorausgefuellt

**Loeschen**
- Bestaetigung via AlertDialog bevor ein Fahrlehrer geloescht wird
- Setzt `aktiv = false` (Soft-Delete), damit bestehende Pruefungsdaten nicht kaputt gehen

### Aenderungen in `src/pages/dashboard/Pruefungen.tsx`

- Import der neuen `InstructorManageDialog`-Komponente
- Neuer State: `instructorDialogOpen`
- Neben dem Fahrlehrer-Select (Zeile 358-374) wird ein kleines Edit-Icon (Pencil) als Button hinzugefuegt
- Klick darauf oeffnet den Fahrlehrer-Verwaltungs-Dialog
- Nach dem Schliessen werden die Fahrlehrer-Daten neu geladen (queryKey `instructors_active`)

### Aenderungen in `src/pages/dashboard/FahrlehrerStatistik.tsx`

- Import der neuen `InstructorManageDialog`-Komponente
- Neuer State: `instructorDialogOpen`
- Im PageHeader wird ein Button "Fahrlehrer verwalten" als `action`-Prop hinzugefuegt
- Nach dem Schliessen werden auch hier die Daten invalidiert (queryKey `instructors-all`)

### Technische Details

| Bereich | Detail |
|---------|--------|
| Neue Datei | `src/components/InstructorManageDialog.tsx` |
| Geaenderte Dateien | `Pruefungen.tsx`, `FahrlehrerStatistik.tsx` |
| DB-Operationen | `INSERT`, `UPDATE` (aktiv-Flag), kein echtes DELETE |
| Eingabefelder | Vorname (Pflicht), Nachname (Pflicht) |
| Query-Invalidierung | `instructors_active`, `instructors-all` |
| Validierung | Vorname und Nachname duerfen nicht leer sein |

