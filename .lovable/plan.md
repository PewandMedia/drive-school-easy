

## Fahrstunden um `einheiten`-Spalte erweitern

### Datenbankänderung

Neue Spalte `einheiten` (integer, NOT NULL, default 1) in `driving_lessons`. Ein Trigger berechnet den Wert automatisch beim Insert/Update:

```text
einheiten = FLOOR(dauer_minuten / 45)
```

Bestehende Daten werden per Migration nachberechnet. Der bestehende Preis-Trigger wird um die Einheiten-Berechnung erweitert (oder ein separater Trigger angelegt).

### Migration (SQL)

1. Spalte hinzufuegen: `ALTER TABLE driving_lessons ADD COLUMN einheiten integer NOT NULL DEFAULT 1`
2. Bestehende Daten aktualisieren: `UPDATE driving_lessons SET einheiten = FLOOR(dauer_minuten / 45)`
3. Trigger-Funktion erweitern (oder neue erstellen), die bei INSERT/UPDATE automatisch `NEW.einheiten := FLOOR(NEW.dauer_minuten / 45)` setzt

### Code-Aenderungen

| Datei | Aenderung |
|---|---|
| `src/pages/dashboard/Fahrstunden.tsx` | DrivingLesson-Typ um `einheiten` erweitern. Statistik "Fahrstunden gesamt" zeigt Summe der Einheiten statt `filtered.length`. Durchschnittsdauer bleibt auf Minutenbasis. In der Tabelle optional Einheiten anzeigen. |
| `src/pages/dashboard/FahrschuelerDetail.tsx` | Sonderfahrten-Zaehlung (`sonderCounts`) bleibt unveraendert (1 Eintrag = 1 Sonderfahrt, das ist korrekt). Aber die Gesamt-Fahrstundenzahl in der Saldo-Uebersicht koennte Einheiten nutzen. |
| `src/pages/dashboard/Abrechnung.tsx` | Pruefen ob dort Fahrstunden gezaehlt werden -- ggf. auf `einheiten` umstellen. |

### Wichtige Entscheidungen

- **Sonderfahrten**: Die Zaehlung ueberland/autobahn/nacht bleibt bei Anzahl Eintraege, da 1 Sonderfahrt = 1 Eintrag (unabhaengig von Dauer). Das `einheiten`-Feld betrifft primaer Uebungsstunden-Statistiken.
- **Schaltstunden (gear_lessons)**: Behalten die bestehende Minutenlogik (`FLOOR(SUM(dauer_minuten) / 45)`), da `gear_lessons` keine `einheiten`-Spalte bekommt (nicht Teil der Anforderung).
- **Bestehende Daten**: `dauer_minuten` bleibt erhalten, `einheiten` wird zusaetzlich gespeichert.

### Technische Details

Der bestehende Trigger `calculate_driving_lesson_price` wird erweitert um eine Zeile:

```text
NEW.einheiten := FLOOR(NEW.dauer_minuten / 45);
```

So werden Preis und Einheiten in einem einzigen Trigger berechnet.

