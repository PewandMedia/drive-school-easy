

## Fahrschüler-Archivierung

Schüler, die mit dem Führerschein fertig sind, sollen archiviert werden können. Die Archivierung nutzt das bestehende `status`-Feld der `students`-Tabelle (Text, nullable) mit dem Wert `"archiviert"`.

### Änderungen

**1. `src/pages/dashboard/Fahrschueler.tsx` — Archiv-Ansicht und Filter**
- Neuer Toggle-Button (z.B. Tabs oder Segmented Control) oben: **"Aktive Schüler"** / **"Archiv"**
- Standard: Aktive Schüler (alle mit `status != 'archiviert'` oder `status IS NULL`)
- Archiv-Ansicht: nur Schüler mit `status = 'archiviert'`
- In der Archiv-Ansicht: Button pro Schüler zum **Wiederherstellen** (setzt `status` zurück auf `null`)

**2. `src/pages/dashboard/FahrschuelerDetail.tsx` — Archivieren-Button**
- Neuer Button im Header-Bereich (neben den bestehenden Aktions-Buttons): **"Archivieren"** mit Archive-Icon
- Klick öffnet AlertDialog zur Bestätigung: "Schüler XY wirklich archivieren?"
- Bei Bestätigung: `UPDATE students SET status = 'archiviert' WHERE id = ...`
- Nach Archivierung: Weiterleitung zurück zur Schülerliste
- Wenn Schüler bereits archiviert ist: stattdessen **"Wiederherstellen"**-Button anzeigen

**3. Visuelle Kennzeichnung**
- Archivierte Schüler in der Liste erhalten ein graues "Archiviert"-Badge
- In der Detailansicht: Banner/Hinweis wenn Schüler archiviert ist

### Dateien

| Datei | Änderung |
|---|---|
| `Fahrschueler.tsx` | Archiv-Tab/Filter, Wiederherstellen-Button in Archiv-Liste |
| `FahrschuelerDetail.tsx` | Archivieren/Wiederherstellen-Button, Bestätigungsdialog, Archiv-Banner |

Keine Datenbankänderung nötig — das bestehende `status`-Feld (text, nullable) wird genutzt.

