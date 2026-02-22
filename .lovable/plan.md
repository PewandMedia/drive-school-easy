

## Searchable Student Dropdowns (Combobox) im gesamten System

### Uebersicht
Alle Fahrschueler-Dropdowns werden durch eine wiederverwendbare Combobox-Komponente ersetzt, die Tippen zum Filtern unterstuetzt. Die bestehende `cmdk`-Bibliothek und die Shadcn `Command`-Komponente sind bereits installiert.

### 1. Neue Komponente: `src/components/StudentCombobox.tsx`

Eine wiederverwendbare Combobox-Komponente mit folgenden Props:
- `students: { id, vorname, nachname, geburtsdatum }[]`
- `value: string` (ausgewaehlte student_id)
- `onValueChange: (id: string) => void`
- `placeholder?: string` (Default: "Schueler auswaehlen...")
- `allowAll?: boolean` (fuer Filter-Dropdowns mit "Alle Schueler"-Option)

Technische Umsetzung:
- Basiert auf Popover + Command (cmdk) -- gleicher Ansatz wie Shadcn Combobox-Pattern
- Suchfeld filtert nach Name UND Geburtsdatum
- Anzeige immer im Format `Nachname, Vorname (TT.MM.JJJJ)` via `formatStudentName`
- `pointer-events-auto` auf dem PopoverContent damit es in Dialogen funktioniert
- Feste `bg-popover` Hintergrundfarbe, hoher z-index

```text
+------------------------------+
| Schueler auswaehlen...   [v] |
+------------------------------+
| [Suche tippen...]            |
| Mustermann, Max (01.01.2000) |
| Schmidt, Anna (15.03.1999)   |
| ...                          |
+------------------------------+
```

### 2. Aenderungen in 6 Dateien

Jede Datei wird wie folgt angepasst:
- Import von `StudentCombobox` statt `Select/SelectContent/SelectItem` (nur fuer Schueler-Selects)
- Ersetzung des Schueler-Select durch `<StudentCombobox>`
- Alle anderen Selects (Typ, Fahrzeug, Status etc.) bleiben unveraendert

| Datei | Stellen | Typ |
|-------|---------|-----|
| `Fahrstunden.tsx` | 1. Filter "Alle Schueler" (Z.523-536) | Filter mit `allowAll` |
| `Fahrstunden.tsx` | 2. Modal "Schueler" (Z.328-343) | Formular |
| `Theorie.tsx` | 3. Modal "Schueler" | Formular |
| `Pruefungen.tsx` | 4. Modal "Schueler" (Z.314-328) | Formular |
| `Leistungen.tsx` | 5. Modal "Fahrschueler" (Z.336-347) | Formular |
| `Zahlungen.tsx` | 6. Modal "Schueler" (Z.304-318) | Formular |

### 3. Technische Details

**Verwendete Bibliotheken (bereits installiert):**
- `cmdk` -- Command/Combobox-Primitive
- `@radix-ui/react-popover` -- Popover-Container
- `lucide-react` -- Check/ChevronsUpDown Icons

**Combobox-Struktur:**
```
Popover
  PopoverTrigger (Button mit aktuellem Wert oder Placeholder)
  PopoverContent (pointer-events-auto, bg-popover, z-50)
    Command
      CommandInput (Suchfeld)
      CommandList
        CommandEmpty ("Kein Schueler gefunden")
        CommandGroup
          [allowAll && CommandItem "Alle Schueler"]
          students.map -> CommandItem mit formatStudentName
```

**Filter-Logik:**
- cmdk filtert automatisch ueber den angezeigten Text
- Zusaetzlich wird `keywords` auf jedem CommandItem gesetzt (email falls vorhanden)
- Kein Server-Side-Query noetig da Schuelerzahlen typischerweise unter 1000 liegen

**Dialog-Kompatibilitaet:**
- `PopoverContent` erhaelt `className="pointer-events-auto"` damit es innerhalb von Radix-Dialogen korrekt funktioniert
- `onOpenAutoFocus={(e) => e.preventDefault()}` verhindert Fokus-Konflikte

