

## Dauer-Input: 15er-Schritte bei Pfeiltasten

### Problem
Der Zahlen-Input neben den Dauer-Buttons (45/90/135 min) erhoet/verringert den Wert beim Klick auf die Pfeiltasten nur um 1 Minute. Das ist unpraktisch, da Fahrstunden typischerweise in 15-Minuten-Schritten geplant werden.

### Loesung
Das HTML-Attribut `step={15}` wird zu allen Dauer-Inputs hinzugefuegt. Dadurch aendern die Pfeiltasten den Wert in 15er-Schritten (z.B. 45 -> 60 -> 75 -> 90).

### Betroffene Dateien

| Datei | Aenderung |
|-------|-----------|
| `src/pages/dashboard/FahrschuelerDetail.tsx` (Zeile ~1414) | `step={15}` zum Dauer-Input hinzufuegen |
| `src/pages/dashboard/Fahrstunden.tsx` (Zeile ~417) | `step={15}` zum Dauer-Input hinzufuegen |
| `src/pages/dashboard/Schaltstunden.tsx` (Zeile ~297) | `step={15}` zum Dauer-Input hinzufuegen |

Minimale Aenderung, drei Zeilen betroffen.
