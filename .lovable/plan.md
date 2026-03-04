

## Drei Aenderungen im Schuelerprofil

### 1. Dialoge offen lassen nach Speichern

In `FahrschuelerDetail.tsx` bei den `onSuccess`-Handlern von `mutTheorie`, `mutPruefung`, `mutLeistung` und `mutZahlung` das `setDlg...(false)` entfernen. Nur das Formular zuruecksetzen (wie bereits bei Fahrstunden implementiert).

- Zeile 334: `setDlgTheorie(false)` entfernen
- Zeile 358: `setDlgPruefung(false)` entfernen  
- Zeile 395: `setDlgLeistung(false)` entfernen
- Zeile 454: `setDlgZahlung(false)` entfernen

### 2. Fehlstunde = 40 EUR, keine Dauer

**Frontend** (`FahrschuelerDetail.tsx`):
- Wenn `typ === "fehlstunde"`: Dauer-Buttons ausblenden, `dauer_minuten` auf 0 setzen, Preisvorschau "40,00 €" anzeigen
- Beim Wechsel zu fehlstunde: `dauer_minuten = 0`, weg von fehlstunde: `dauer_minuten = 45`

**DB-Migration** (neue Datei):
- `calculate_driving_lesson_price` Trigger erweitern: wenn `typ = 'fehlstunde'` dann `preis := 40`, `einheiten := 0`, sonst bisherige Berechnung

### 3. Datum und Uhrzeit bei Leistungen hinzufuegen

Die `services`-Tabelle hat aktuell kein `datum`-Feld. `created_at` existiert aber.

**Option A**: `created_at` als Datumsfeld nutzen (kein Schema-Aenderung noetig)
**Option B**: Neues `datum`-Feld per Migration hinzufuegen

Da Leistungen ein explizites Datum haben sollten (unabhaengig vom Erstellzeitpunkt), wird eine **Migration** benoetigt:
- `ALTER TABLE services ADD COLUMN datum timestamptz NOT NULL DEFAULT now();`
- Frontend: `fsLeistung` um `datum` erweitern (datetime-local Input)
- Insert/Update: `datum` mitsenden
- Anzeige in der Leistungen-Tabelle: Datum anzeigen

### Zusammenfassung

| Datei | Aenderung |
|---|---|
| `FahrschuelerDetail.tsx` | Dialoge offen lassen, Fehlstunde-UI, Leistung-Datum-Feld |
| DB-Migration (neu) | Trigger fuer Fehlstunde=40€ + `services.datum` Spalte |

