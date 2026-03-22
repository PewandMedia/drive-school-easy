

## Druckübersicht bereinigen: Fahrzeug-Spalte und Uhrzeiten entfernen

### Problem
In der Druckansicht des Schülerprofils werden aktuell:
1. **Fahrzeug-Spalte** (Automatik/Schalter) bei Fahrstunden angezeigt — soll entfernt werden
2. **Uhrzeiten** bei Datumsangaben angezeigt (`dd.MM.yyyy HH:mm`) — soll nur `dd.MM.yyyy` sein

### Änderungen in `src/pages/dashboard/FahrschuelerDetail.tsx`

Betrifft beide Print-Bereiche: **PRINT AREA** (Einzeldruck) und **MULTI-PRINT AREA** (Übersichtsdruck).

**Fahrstunden-Tabelle (2× im Code):**
- `<th>Fahrzeug</th>` Spalte entfernen
- `<td>{FAHRZEUG_LABELS[...]}</td>` Zelle entfernen
- Datum von `"dd.MM.yyyy HH:mm"` → `"dd.MM.yyyy"` ändern

**Leistungen-Tabelle (2× im Code):**
- Datum von `"dd.MM.yyyy HH:mm"` → `"dd.MM.yyyy"` ändern

| Zeile | Änderung |
|---|---|
| 2771, 2950 | `<th>Fahrzeug</th>` entfernen |
| 2781, 2960 | Datum-Format: `HH:mm` entfernen |
| 2784, 2963 | Fahrzeug-Zelle `<td>` entfernen |
| 2812, 3021 | Leistungen-Datum: `HH:mm` entfernen |

