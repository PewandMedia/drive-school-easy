
## Erweiterung Sonderfahrten-Block mit Schaltstunden (B197)

### Analyse des aktuellen Codes

In `FahrschuelerDetail.tsx` existieren aktuell zwei getrennte Blöcke:

1. **Sonderfahrten-Block** (Zeilen 360–419): Zeigt Überland / Autobahn / Nacht als identisch aufgebaute Fortschrittsbalken – aber nur bei Nicht-Umschreibern
2. **Schaltstunden-Block** (Zeilen 465–540): Ein separater Block für B197, der Schaltstunden (via Minuten-Berechnung) und Testfahrt B197 enthält

Der User möchte die Schaltstunden optisch identisch zu Überland/Autobahn/Nacht **im Sonderfahrten-Block** integrieren – mit `COUNT(*)` statt Minuten-Berechnung.

### Konkrete Änderungen

#### 1. Berechnungslogik anpassen

Die aktuelle Berechnung nutzt Minuten:
```typescript
const gearHoursDone = Math.floor(gearMinutesTotal / 45);
```

Neu: Anzahl der Einträge direkt verwenden:
```typescript
const gearCount = gearLessons.length; // COUNT(*) aus gear_lessons
const gearRequired = SCHALTSTUNDEN_PFLICHT; // = 10
const gearPct = Math.min(100, Math.round((gearCount / gearRequired) * 100));
const gearComplete = gearCount >= gearRequired;
```

Die Variable `gearMinutesTotal` und `gearHoursDone` werden im separaten Schaltstunden-Block weiterhin verwendet – diese bleiben unberührt.

#### 2. Sonderfahrten-Block erweitern (Zeilen 386–416)

Nach den drei bestehenden `map`-Iterationen (ueberland, autobahn, nacht) wird ein **konditionaler Eintrag für Schaltstunden** hinzugefügt – nur wenn `isB197 === true`.

Der neue Eintrag folgt exakt dem gleichen JSX-Muster:

```text
Schaltstunden
0 / 10                          ✓ (wenn fertig)
▓▓▓░░░░░░░  30%
```

Bedingung für Anzeige:
- `!student.ist_umschreiber` (bereits durch äußere if-Bedingung gegeben)
- `isB197 === true`

#### 3. `allSonderComplete`-Logik erweitern

Aktuell:
```typescript
const allSonderComplete =
  !student?.ist_umschreiber &&
  sonderCounts.ueberland >= PFLICHT.ueberland &&
  sonderCounts.autobahn >= PFLICHT.autobahn &&
  sonderCounts.nacht >= PFLICHT.nacht;
```

Neu – bei B197 muss auch `gearComplete` erfüllt sein:
```typescript
const allSonderComplete =
  !student?.ist_umschreiber &&
  sonderCounts.ueberland >= PFLICHT.ueberland &&
  sonderCounts.autobahn >= PFLICHT.autobahn &&
  sonderCounts.nacht >= PFLICHT.nacht &&
  (!isB197 || gearComplete); // B197: Schaltstunden müssen auch erfüllt sein
```

#### 4. Separater Schaltstunden-Block bleibt unverändert

Der bestehende Block „Schaltstunden & Schaltberechtigung" (Zeilen 465–540) mit Testfahrt B197 und Schaltberechtigungs-Banner bleibt **vollständig erhalten**. Die neue Schaltstunden-Anzeige im Sonderfahrten-Block ist eine zusätzliche, kompaktere Sicht.

### Anzeigeregeln im Überblick

```text
ist_umschreiber = true:
  → Sonderfahrten-Block: NICHT anzeigen (bleibt so)
  → Schaltstunden im Sonderfahrten-Block: NICHT anzeigen
  → Separater Schaltstunden/Schaltberechtigungs-Block: NICHT anzeigen (bleibt so)

ist_umschreiber = false, Klasse B oder B78:
  → Sonderfahrten: Überland / Autobahn / Nacht (wie bisher)
  → Schaltstunden im Block: NICHT anzeigen
  → Separater Block: NICHT anzeigen (bleibt so)

ist_umschreiber = false, Klasse B197:
  → Sonderfahrten: Überland / Autobahn / Nacht / Schaltstunden (NEU)
  → Separater Block: Schaltstunden (Minuten) + Testfahrt B197 + Schaltberechtigungs-Banner (bleibt so)
```

### Geänderte Datei

| Datei | Änderung |
|---|---|
| `src/pages/dashboard/FahrschuelerDetail.tsx` | Schaltstunden-Fortschritt im Sonderfahrten-Block ergänzt (nach Nacht-Eintrag, nur bei B197); `allSonderComplete`-Logik angepasst |

Keine Datenbankänderungen – `gear_lessons` existiert bereits, Query ist bereits vorhanden.
