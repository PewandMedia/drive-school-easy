

## Dauer-Feld im Modal "Fahrstunde eintragen" auf leer/0 setzen

### Uebersicht
Der Standardwert fuer `dauer_minuten` wird von 45 auf 0 geaendert. Das Feld zeigt initial "0" als Platzhalter an, und Preis/Einheiten werden erst nach Eingabe berechnet. Eine Validierung verhindert das Speichern mit 0 Minuten.

### Aenderungen in `src/pages/dashboard/Fahrstunden.tsx`

**1. Default-Wert aendern (Zeile 92)**
- `dauer_minuten: 45` wird zu `dauer_minuten: 0`

**2. Preisvorschau anpassen (Zeile 304 und Zeilen 451-458)**
- Wenn `dauer_minuten === 0`, wird statt "0.00 EUR" ein Platzhaltertext wie "–" angezeigt
- Sonst wie bisher berechnet

**3. Schnellwahl-Buttons anpassen (Zeilen 423-434)**
- Keiner der Buttons (45/90/135) ist initial aktiv, da `form.dauer_minuten` mit 0 startet
- Verhalten bleibt sonst gleich

**4. Manuelle Eingabe anpassen (Zeilen 436-447)**
- Fallback bei leerem Feld: `parseInt(e.target.value) || 0` statt `|| 45`
- `value` zeigt `form.dauer_minuten || ""` damit das Feld visuell leer erscheint bei 0
- `min` auf 0 setzen (oder entfernen)

**5. Validierung im Submit-Handler hinzufuegen (ca. Zeile 260)**
- Pruefung: wenn `dauer_minuten <= 0`, Toast-Fehlermeldung "Bitte eine Dauer eingeben" und Abbruch
- Gleiche Stelle wie die bestehende `student_id`-Validierung

