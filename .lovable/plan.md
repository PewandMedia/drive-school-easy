
## Fortschrittsanzeige Sonderfahrten pro Schüler

### Übersicht

Die Fortschrittsanzeige zeigt pro Schüler, wie viele Pflicht-Sonderfahrten bereits absolviert wurden. Die Logik greift auf die bestehende Tabelle `driving_lessons` zu und zählt Einträge nach `typ`.

**Pflichtanforderungen (nur für Nicht-Umschreiber):**

| Typ | Pflicht |
|---|---|
| ueberland | 5 Fahrten |
| autobahn | 4 Fahrten |
| nacht | 3 Fahrten |

Wenn `student.ist_umschreiber = true` → Sonderfahrten werden komplett ausgeblendet, keine Pflichtberechnung.

---

### Wo wird die Fortschrittsanzeige eingebaut?

Die Fortschrittsanzeige wird in **zwei Stellen** integriert:

1. **`FahrschuelerDetail.tsx`** – vollständig neu implementiert mit echten Daten aus Supabase, Stammdaten des Schülers und dem Fortschritts-Block für Sonderfahrten
2. **`Fahrschueler.tsx`** (Listenansicht) – kleines kompaktes Fortschritts-Widget pro Zeile (optional, nur Mini-Anzeige)

Der Hauptfokus liegt auf der Detailseite.

---

### Technische Umsetzung

#### Kein Datenbankumbau nötig

Alle benötigten Daten sind bereits vorhanden:
- `driving_lessons.typ` enthält die Sonderfahrten-Typen
- `driving_lessons.student_id` verknüpft mit dem Schüler
- `students.ist_umschreiber` steuert, ob Pflicht gilt

#### Datenabfragen in `FahrschuelerDetail.tsx`

```
students      → Stammdaten, ist_umschreiber
driving_lessons WHERE student_id = :id → alle Fahrstunden des Schülers
```

#### Berechnungslogik (Frontend)

```typescript
const PFLICHT = {
  ueberland: 5,
  autobahn: 4,
  nacht: 3,
};

// Anzahl je Typ zählen
const counts = {
  ueberland: lessons.filter(l => l.typ === "ueberland").length,
  autobahn:  lessons.filter(l => l.typ === "autobahn").length,
  nacht:     lessons.filter(l => l.typ === "nacht").length,
};

// Fortschritt: absolviert / erforderlich
// Bei Umschreiber → Block nicht rendern
```

#### UI-Komponente: Fortschrittsblock

Für jeden Sonderfahrten-Typ ein Eintrag mit:
- Label (Überlandfahrt / Autobahnfahrt / Nachtfahrt)
- Anzeige: `absolviert / erforderlich` (z.B. `3 / 5`)
- Fortschrittsbalken (Progress-Komponente aus `@radix-ui/react-progress`, bereits installiert)
- Farbe: grün wenn erfüllt (`absolviert >= erforderlich`), sonst primär/blau

```
┌─────────────────────────────────────────────┐
│  Sonderfahrten                              │
│                                             │
│  Überlandfahrt          3 / 5               │
│  ████████░░░░░░░░░░░░   60%                │
│                                             │
│  Autobahnfahrt          4 / 4  ✓           │
│  ████████████████████   100%               │
│                                             │
│  Nachtfahrt             1 / 3              │
│  ████░░░░░░░░░░░░░░░░   33%               │
└─────────────────────────────────────────────┘
```

Bei `ist_umschreiber = true` → Block komplett ausgeblendet, stattdessen Badge "Umschreiber – keine Sonderfahrten erforderlich".

---

### Geänderte Dateien

| Datei | Änderung |
|---|---|
| `src/pages/dashboard/FahrschuelerDetail.tsx` | Vollständig neu implementiert: Stammdaten aus Supabase, Fahrstunden-Query, Fortschrittsanzeige Sonderfahrten, Leistungen-Liste |

Keine Datenbankänderung erforderlich. Keine Migration nötig.

---

### Detailaufbau der neuen FahrschuelerDetail-Seite

**Linke Spalte (1/3):** Schüler-Profil-Karte
- Avatar-Icon mit Initialen
- Name, Klasse, Umschreiber-Badge
- Kontaktdaten (E-Mail, Telefon, Adresse)
- Anmeldedatum

**Rechte Spalte (2/3):** Tabs oder Sektionen:
1. **Sonderfahrten-Fortschritt** (wenn kein Umschreiber)
2. **Fahrstunden** – Liste der letzten Fahrstunden des Schülers
3. **Leistungen** – aus `services`-Tabelle mit Status und Saldo
