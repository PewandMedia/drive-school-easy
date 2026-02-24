

## Theoriestunden auf Lektionen 1-14 umstellen

### Uebersicht
Das bisherige System mit nur "Grundstoff" / "Klassenspezifisch" wird auf konkrete Lektionsnummern (1-14) umgestellt. Lektion 1-12 = Grundstoff, Lektion 13-14 = Klassenspezifisch. Die Fortschrittsanzeige zeigt dann an, welche konkreten Lektionen absolviert sind und welche fehlen.

### Aenderung 1: Datenbank-Migration

- Neue Spalte `lektion` (integer, nullable) zur Tabelle `theory_sessions` hinzufuegen
- Bestehende Eintraege migrieren: `grundstoff` -> lektion NULL (bleiben als Altdaten bestehen), `klassenspezifisch` -> lektion NULL
- Die `typ`-Spalte bleibt bestehen (wird automatisch aus der Lektion abgeleitet), damit bestehende Abfragen nicht sofort brechen
- Alternativ: Die `typ`-Spalte behalten und automatisch aus `lektion` ableiten

```sql
ALTER TABLE public.theory_sessions 
ADD COLUMN lektion integer;

-- Bestehende Eintraege behalten ihren typ, lektion bleibt NULL fuer Altdaten
```

### Aenderung 2: `src/pages/dashboard/Theorie.tsx` (Theorie-Uebersichtsseite)

**Popup "Neue Theoriestunde":**
- Das bisherige Typ-Dropdown (Grundstoff/Klassenspezifisch) ersetzen durch ein Lektions-Dropdown:
  - "Lektion 1 -- Grundstoff"
  - "Lektion 2 -- Grundstoff"
  - ...
  - "Lektion 12 -- Grundstoff"
  - "Lektion 13 -- Klassenspezifisch"
  - "Lektion 14 -- Klassenspezifisch"
- Der `typ` wird automatisch aus der Lektion abgeleitet (1-12 = grundstoff, 13-14 = klassenspezifisch)
- Form-State: `lektion: number` statt `typ: string`

**Tabelle:**
- Spalte "Typ" ersetzen durch "Lektion" mit Anzeige z.B. "Lektion 3 (Grundstoff)"
- Badge-Farbe bleibt: Grundstoff = default, Klassenspezifisch = secondary

**Statistiken:**
- "Theoriestunden gesamt" bleibt
- "Schueler mit Grundstoff" -> "Unterschiedliche Lektionen" oder beibehalten
- "Klassenspezifisch" bleibt

### Aenderung 3: `src/pages/dashboard/FahrschuelerDetail.tsx` (Schuelerprofil)

**Theorie-Dialog (Modal):**
- Gleiches Lektions-Dropdown wie auf der Theorie-Seite
- Warnung anzeigen wenn die gewaehlte Lektion fuer diesen Schueler bereits absolviert wurde:
  "Lektion X wurde bereits am TT.MM.JJJJ besucht. Sie wird nicht doppelt fuer die Pflicht gezaehlt."

**Fortschrittsanzeige im Bereich "Theorieunterricht":**
- Weiterhin Fortschrittsbalken: "Grundstoff X/12" und "Klassenspezifisch X/2"
- Neu: Darunter eine Checkliste der einzelnen Lektionen:

```text
Grundstoff:
[x] Lektion 1   [x] Lektion 2   [ ] Lektion 3   [x] Lektion 4
[ ] Lektion 5   [ ] Lektion 6   [x] Lektion 7   [ ] Lektion 8
[ ] Lektion 9   [ ] Lektion 10  [ ] Lektion 11  [ ] Lektion 12

Klassenspezifisch:
[x] Lektion 13  [ ] Lektion 14
```

**Fortschrittslogik:**
- Zaehlung fuer die Pflicht: Nur *unterschiedliche* Lektionen zaehlen (keine Doppelzaehlung)
- `grundstoff`: Anzahl einzigartiger Lektionen 1-12
- `klassenspezifisch`: Anzahl einzigartiger Lektionen 13-14
- Altdaten (lektion = NULL): Zaehlen weiterhin nach ihrem `typ`-Feld, jeweils als 1 Einheit

### Aenderung 4: Insert-Logik anpassen

Beim Einfuegen einer neuen Theoriestunde:
- `lektion` wird gespeichert
- `typ` wird automatisch abgeleitet: lektion <= 12 -> "grundstoff", lektion >= 13 -> "klassenspezifisch"
- Beides wird in die DB geschrieben fuer Abwaertskompatibilitaet

### Technische Details

**Lektions-Konstante (wiederverwendbar):**
```text
const THEORIE_LEKTIONEN = Array.from({ length: 14 }, (_, i) => ({
  nr: i + 1,
  typ: i < 12 ? "grundstoff" : "klassenspezifisch",
  label: `Lektion ${i + 1} – ${i < 12 ? "Grundstoff" : "Klassenspezifisch"}`,
}));
```

**Fortschrittsberechnung (Schuelerprofil):**
```text
const uniqueGrundstoff = new Set(
  theorySessions
    .filter(s => s.lektion && s.lektion >= 1 && s.lektion <= 12)
    .map(s => s.lektion)
);
// Plus Altdaten ohne lektion
const altGrundstoff = theorySessions.filter(s => !s.lektion && s.typ === "grundstoff").length;
const grundstoffDone = uniqueGrundstoff.size + altGrundstoff;
```

**Duplikat-Warnung:**
```text
const alreadyDone = theorySessions.find(s => s.lektion === selectedLektion);
if (alreadyDone) {
  // Warnung anzeigen, Speichern trotzdem erlauben
}
```

### Zusammenfassung

| Datei / Bereich | Aenderung |
|-----------------|-----------|
| DB-Migration | Spalte `lektion` (integer, nullable) hinzufuegen |
| `Theorie.tsx` | Lektions-Dropdown statt Typ-Dropdown, Tabelle zeigt Lektion, Typ wird abgeleitet |
| `FahrschuelerDetail.tsx` | Lektions-Dropdown im Dialog, Duplikat-Warnung, Checkliste der Lektionen in Fortschrittsanzeige |
| Fortschrittslogik | Zaehlung basiert auf einzigartigen Lektionen (keine Doppelzaehlung) |

