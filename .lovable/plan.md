

## Fahrstunden-Dialog nach Speichern offen lassen

### Problem
Beim Speichern einer Fahrstunde schliesst sich das "Neue Fahrstunde"-Fenster automatisch. Der Benutzer moechte mehrere Fahrstunden hintereinander eintragen koennen, ohne das Fenster jedes Mal neu oeffnen zu muessen.

### Loesung
In der `onSuccess`-Callback der Fahrstunden-Mutation wird `setDlgFahrstunde(false)` entfernt. Das Formular wird weiterhin zurueckgesetzt (leere Felder), aber der Dialog bleibt offen. Geschlossen wird nur manuell ueber das X oder den Abbrechen-Button.

### Betroffene Datei

| Datei | Aenderung |
|-------|-----------|
| `src/pages/dashboard/FahrschuelerDetail.tsx` (Zeile 287) | `setDlgFahrstunde(false)` aus `onSuccess` entfernen |

Eine Zeile Aenderung.

