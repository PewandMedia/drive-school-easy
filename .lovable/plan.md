

## Fehlstunden vom Lernfortschritt ausschliessen

### Uebersicht
Fahrstunden vom Typ `fehlstunde` bleiben als Eintraege sichtbar und werden weiterhin bepreist (Abrechnung unveraendert). Sie werden jedoch aus allen Fortschritts-/Statistik-Berechnungen ausgeschlossen.

### Betroffene Datei: `src/pages/dashboard/FahrschuelerDetail.tsx`

Dies ist die Hauptdatei mit Fortschrittsanzeigen. Drei Stellen muessen angepasst werden:

**1. `gesamtEinheiten` (Zeile 380)**
Aktuell: Zaehlt ALLE Lessons inkl. Fehlstunden.
Neu: Fehlstunden ausfiltern.

```
// Vorher
const gesamtEinheiten = lessons.reduce((s, l) => s + (l.einheiten || 1), 0);

// Nachher
const gesamtEinheiten = lessons
  .filter((l) => l.typ !== "fehlstunde")
  .reduce((s, l) => s + (l.einheiten || 1), 0);
```

**2. `uebungsstundenEinheiten` (Zeile 376-378)**
Aktuell: Filtert bereits auf `typ === "uebungsstunde"` -- bereits korrekt, keine Aenderung noetig.

**3. `sonderCounts` (Zeile 370-374)**
Aktuell: Filtert auf spezifische Typen (ueberland/autobahn/nacht) -- bereits korrekt, keine Aenderung noetig.

### Betroffene Datei: `src/pages/dashboard/Fahrstunden.tsx`

Die Statistik-Karten oben auf der Seite zeigen "Einheiten gesamt". Diese sollen Fehlstunden ebenfalls ausschliessen:

**Einheiten-Statistik (ca. Zeile 300)**
```
// Vorher
filtered.reduce((s, l) => s + (l.einheiten ?? Math.floor(l.dauer_minuten / 45)), 0)

// Nachher
filtered.filter(l => l.typ !== "fehlstunde").reduce((s, l) => s + (l.einheiten ?? Math.floor(l.dauer_minuten / 45)), 0)
```

**Gesamtumsatz und Durchschnittsdauer** bleiben unveraendert (Abrechnung wie gewuenscht beibehalten).

### Nicht betroffene Dateien
- `Dashboard.tsx`: Zeigt nur Umsatz/Aktivitaeten, keine Fortschrittsbalken -- bleibt unveraendert
- `Abrechnung.tsx`: Reine Abrechnungsdaten -- bleibt unveraendert
- `FahrlehrerStatistik.tsx`: Basiert auf Pruefungen, nicht Fahrstunden -- bleibt unveraendert
- `Auswertung.tsx`: Noch Platzhalter -- bleibt unveraendert

### Zusammenfassung der Aenderungen

| Datei | Was | Aenderung |
|-------|-----|-----------|
| `FahrschuelerDetail.tsx` | `gesamtEinheiten` | `.filter(l => l.typ !== "fehlstunde")` hinzufuegen |
| `Fahrstunden.tsx` | Einheiten-Statistik-Karte | `.filter(l => l.typ !== "fehlstunde")` hinzufuegen |

Nur 2 Zeilen in 2 Dateien muessen geaendert werden.
