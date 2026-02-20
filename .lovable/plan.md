

## Fahrstunden-Seite: Gruppierte Ansicht nach Schueler

### Uebersicht

Die Fahrstunden-Seite wird um einen Schueler-Filter und eine gruppierte Ansicht erweitert, damit bei vielen Eintraegen die Uebersicht gewahrt bleibt.

### Aenderungen

#### 1. Neuer State: `filterStudent`

Ein neuer State `filterStudent` (default: `"all"`) wird hinzugefuegt. Dieser steuert, ob alle Schueler oder nur ein bestimmter angezeigt wird.

#### 2. Ansichts-Toggle

Im Filterbereich (Zeilen 425-468) wird ein dritter Select hinzugefuegt:
- **Schueler-Filter** -- Dropdown mit "Alle Schueler" + Liste aller Schueler
- Wird ein Schueler gewaehlt, werden Statistiken und Tabelle nur fuer diesen berechnet

#### 3. Statistiken reagieren auf Filter

Die drei Statistik-Karten (Gesamtumsatz, Fahrstunden gesamt, Durchschnittsdauer) werden basierend auf den gefilterten Daten berechnet -- nicht mehr immer auf `lessons`, sondern auf die aktive Auswahl.

#### 4. Gruppierte Ansicht (kein Schueler gewaehlt)

Wenn `filterStudent === "all"`:
- Fahrstunden werden nach Schueler gruppiert
- Jede Gruppe bekommt eine eigene Card mit dem Schuelernamen als Ueberschrift und einer Mini-Zusammenfassung (Anzahl Stunden, Gesamtpreis)
- Innerhalb der Card eine kompakte Tabelle mit Datum, Typ, Fahrzeug, Dauer, Preis, Loeschen-Button
- Gruppen alphabetisch nach Nachname sortiert

#### 5. Einzelansicht (Schueler gewaehlt)

Wenn ein bestimmter Schueler gewaehlt ist:
- Normale Tabellenansicht wie bisher, aber nur fuer diesen Schueler
- Statistiken zeigen nur dessen Werte

### Technische Details

| Bereich | Detail |
|---|---|
| Keine neuen DB-Abfragen | Gruppierung erfolgt rein clientseitig aus dem bestehenden `lessons`-Array |
| Gruppierungs-Logik | `Object.groupBy` bzw. manuelles `reduce` ueber `student_id` |
| Bestehende Filter | Typ- und Fahrzeug-Filter wirken weiterhin -- auch innerhalb der Gruppen |
| Neue Imports | `Users` Icon aus lucide-react fuer den Schueler-Filter |

### Betroffene Datei

| Datei | Aenderung |
|---|---|
| `src/pages/dashboard/Fahrstunden.tsx` | Schueler-Filter, gruppierte Ansicht, adaptive Statistiken |

