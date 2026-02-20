

## Fahrstunden-Uebersicht im Schuelerprofil auf Einheiten umstellen

### Was aendert sich

Die Sonderfahrten-Zaehlung im Schuelerprofil wird von "Anzahl Eintraege" (`lessons.filter(...).length`) auf "Summe der Einheiten" (`SUM(einheiten)`) umgestellt. Zusaetzlich werden Uebungsstunden und Gesamt-Fahrstunden als separate Zeilen angezeigt.

### Aenderungen in `FahrschuelerDetail.tsx`

#### 1. Berechnung (Zeilen 164-168)

`sonderCounts` wird von `.length` auf `.reduce((s,l) => s + (l.einheiten || 1), 0)` umgestellt:

```text
ueberland: SUM(einheiten) WHERE typ = ueberland
autobahn:  SUM(einheiten) WHERE typ = autobahn
nacht:     SUM(einheiten) WHERE typ = nacht
```

#### 2. Neue Variablen hinzufuegen

- `uebungsstundenEinheiten`: SUM(einheiten) WHERE typ = uebungsstunde
- `gesamtEinheiten`: SUM(einheiten) ueber alle driving_lessons

#### 3. Sonderfahrten-Block erweitern (ca. Zeile 390-443)

Vor den bestehenden Sonderfahrten-Fortschrittsbalken zwei neue Zeilen einfuegen:

- **Uebungsstunden**: Anzahl ohne Fortschrittsbalken (keine Pflichtanzahl)
- **Gesamt-Fahrstunden**: Gesamtsumme aller Einheiten als Zusammenfassung am Ende des Blocks

#### 4. Saldo-Uebersicht (Zeile 327)

Vereinfachung: `(l as any).einheiten` wird zu `l.einheiten` -- das Feld existiert jetzt im Typ.

### Betroffene Datei

| Datei | Aenderung |
|---|---|
| `src/pages/dashboard/FahrschuelerDetail.tsx` | sonderCounts auf einheiten umstellen, Uebungsstunden + Gesamt hinzufuegen |

